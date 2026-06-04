export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/adminAuth'
import { googleAccessToken, googleEnv } from '../../../../lib/google'
export async function POST(req){
  const denied=requireAdmin(req); if(denied) return denied
  try{
    const body=await req.json(); const customer=body.customer||body.data||body
    const env=googleEnv(); const access=await googleAccessToken()
    const safeName=String(customer.name||customer.customerName||customer.address||'yard-loop-customer').replace(/[^a-z0-9-_ ]/gi,'').slice(0,80)
    const meta={name:`Yard Loop - ${safeName} - ${new Date().toISOString().slice(0,10)}.json`,mimeType:'application/json',...(env.driveFolderId?{parents:[env.driveFolderId]}:{})}
    const boundary='yardloop_'+Date.now()
    const multipart=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(customer,null,2)}\r\n--${boundary}--`
    const r=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',{method:'POST',headers:{Authorization:`Bearer ${access}`,'Content-Type':`multipart/related; boundary=${boundary}`},body:multipart})
    const j=await r.json().catch(()=>({}))
    if(!r.ok) throw new Error(j.error?.message||'Drive upload failed')
    return NextResponse.json({ok:true,fileId:j.id,webViewLink:j.webViewLink})
  }catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})}
}
