export const dynamic = 'force-dynamic'
import { requireAdmin } from '../../lib/adminAuth.js'
function esc(v=''){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function money(n){return `$${Math.round(Number(n||0)).toLocaleString()}`}
export async function POST(req){
  const denied=requireAdmin(req); if(denied) return denied
  let payload={}
  try{
    const raw=await req.text()
    if(raw.length>100_000) return Response.json({ok:false,error:'Request body too large. Limit is 100 KB.'},{status:413})
    payload=raw?JSON.parse(raw):{}
  }catch(e){return Response.json({ok:false,error:'Invalid JSON body.'},{status:400})}
  const {lead={},estimate={},draft={},calc={}}=payload
  const apiKey=process.env.RESEND_API_KEY||''
  if(!apiKey) return Response.json({ok:false,skipped:true,error:'Missing RESEND_API_KEY'})
  if(!lead.email) return Response.json({ok:false,skipped:true,error:'Customer email missing'})
  const services=(draft.selectedServices||[]).join(', ')
  const html=`<div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;border:1px solid #dfe9d9;border-radius:18px;padding:24px;color:#102033"><h1>Your Yard Loop Estimate</h1><p>Hi ${esc(lead.name||'there')},</p><p>Here is a copy of the Yard Loop estimate prepared for your property.</p><p><b>Service address:</b><br/>${esc(lead.address||draft.address||'')}</p><p><b>Estimated monthly total:</b> ${money(calc.monthly||lead.monthly)}<br/><b>Contract length:</b> ${esc(draft.contractLength||12)} months<br/><b>Selected services:</b> ${esc(services||'See agreement details')}</p><p>This estimate is preliminary until final property review, contractor feedback, access, service scope, and seasonal scheduling are confirmed.</p><p>To approve or update this plan, contact Yard Loop.</p><p><b>Yard Loop</b><br/>402-235-6168<br/>info@yard-loop.com</p></div>`
  const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.RESEND_FROM_EMAIL||'Yard Loop <onboarding@resend.dev>',to:[lead.email],bcc:[process.env.NOTIFY_EMAIL||'info@yard-loop.com'],reply_to:process.env.REPLY_TO_EMAIL||'info@yard-loop.com',subject:'Your Yard Loop Estimate',html})})
  if(!res.ok) return Response.json({ok:false,error:await res.text().catch(()=>String(res.status))},{status:500})
  return Response.json({ok:true})
}
