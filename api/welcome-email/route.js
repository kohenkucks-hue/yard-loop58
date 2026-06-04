export const dynamic = 'force-dynamic'
import { requireAdmin } from '../../lib/adminAuth.js'
function esc(v=''){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function money(n){return `$${Math.round(Number(n||0)).toLocaleString()}`}
export async function POST(req){
  const denied=requireAdmin(req); if(denied) return denied
  let payload = {}
  try{
    const raw = await req.text()
    if(raw.length > 100_000) return Response.json({ok:false,error:'Request body too large. Limit is 100 KB.'},{status:413})
    payload = raw ? JSON.parse(raw) : {}
  }catch(e){
    return Response.json({ok:false,error:'Invalid JSON body.'},{status:400})
  }
  const {customer={},contract={}}=payload
  const apiKey=process.env.RESEND_API_KEY||''
  if(!apiKey) return Response.json({ok:false,skipped:true,error:'Missing RESEND_API_KEY'})
  if(!customer.email) return Response.json({ok:false,skipped:true,error:'Customer email missing'})
  const checkoutLink = `${process.env.NEXT_PUBLIC_SITE_URL||'https://www.yard-loop.com'}/checkout?customerId=${encodeURIComponent(customer.id||'')}&token=${encodeURIComponent(customer.checkoutToken||contract.checkoutToken||'')}`
  const services=(contract.serviceLabels||customer.selectedServices||[]).join(', ')
  const html=`<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;border:1px solid #dfe9d9;border-radius:18px;padding:24px"><h1>Welcome to Yard Loop</h1><p>Hi ${esc(customer.name||'there')},</p><p>Your Yard Loop property plan has been approved and signed.</p><p><b>Monthly plan:</b> ${money(customer.monthly||contract.monthly)}<br/><b>Services:</b> ${esc(services)}</p><p>Next step: complete your payment setup using the secure checkout link below.</p><p><a href="${checkoutLink}" style="background:#49a942;color:white;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold">Set Up Payment</a></p>${customer.contractUrl?`<p><a href="${customer.contractUrl}">Download your signed contract</a></p>`:''}<p>One Plan. All Year. Total Peace of Mind.</p><p>Kevin Kucks<br/>Owner, Yard Loop</p></div>`
  const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.RESEND_FROM_EMAIL||'Yard Loop <onboarding@resend.dev>',to:[customer.email],bcc:[process.env.NOTIFY_EMAIL||'info@yard-loop.com'],reply_to:process.env.REPLY_TO_EMAIL||'info@yard-loop.com',subject:'Welcome to Yard Loop — Your Property Plan Is Approved',html})})
  if(!res.ok) return Response.json({ok:false,error:await res.text().catch(()=>String(res.status))},{status:500})
  return Response.json({ok:true})
}
