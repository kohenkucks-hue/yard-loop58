export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { readJsonBlob, writeJsonBlob } from '../../../lib/blobJson'
import { sendEmail } from '../../../lib/communications'
const CRM_KEY='yard-loop-rep-portal.json'
export async function POST(req){
  try{
    const {token,type,startDate,endDate,reason,service}=await req.json()
    const crm=await readJsonBlob(CRM_KEY,{})
    const session=(crm.portalSessions||[]).find(s=>s.token===token && new Date(s.expiresAt)>new Date())
    if(!session) return NextResponse.json({ok:false,error:'Portal link expired or invalid.'},{status:401})
    const customer=(crm.customers||[]).find(c=>c.id===session.customerId)
    if(!customer) return NextResponse.json({ok:false,error:'Customer not found.'},{status:404})
    const id=`req_${Date.now()}`
    const row={id,customerId:customer.id,customerName:customer.name,type:type||'General Request',service:service||'',startDate:startDate||'',endDate:endDate||'',reason:reason||'',status:'Pending Owner Review',createdAt:new Date().toISOString()}
    const requests=[row,...(crm.portalRequests||crm.cancellations||[])]
    const cancellations=type==='Cancel Service'?[{...row,noticedDate:new Date().toISOString().slice(0,10),effectiveDate:endDate||'',balanceOwed:0,processedBy:'Customer Portal',status:'Requested'},...(crm.cancellations||[])]:crm.cancellations||[]
    await writeJsonBlob(CRM_KEY,{...crm,portalRequests:requests,cancellations,activity:[{id,at:new Date().toISOString(),who:'Customer Portal',text:`${customer.name} submitted ${row.type}`},...(crm.activity||[])].slice(0,500),savedAt:new Date().toISOString()})
    if(process.env.NOTIFY_EMAIL) await sendEmail({to:process.env.NOTIFY_EMAIL,subject:`Yard Loop customer request: ${row.type}`,html:`<p>${customer.name} submitted a ${row.type} request.</p><p>${row.reason}</p>`}).catch(()=>{})
    return NextResponse.json({ok:true,request:row})
  }catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})}
}
