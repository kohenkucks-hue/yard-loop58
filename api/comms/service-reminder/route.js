export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { sendEmailSms, esc } from '../../../lib/communications'
export async function POST(req){ const denied=requireAdmin(req); if(denied)return denied; try{const {customer={},job={}}=await req.json(); const service=job.service||job.serviceLabel||'service'; const date=job.due||job.scheduledDate||'your scheduled date'; const html=`<p>Hi ${esc(customer.name||job.customerName||'there')},</p><p>Your Yard Loop ${esc(service)} is scheduled for <b>${esc(date)}</b> at ${esc(job.address||customer.address||'your property')}.</p><p>Reply with any gate, pet, or access notes.</p>`; const sms=`Yard Loop: Your ${service} is scheduled for ${date}. Reply with gate/pet/access notes.`; const result=await sendEmailSms({email:customer.email||job.email,phone:customer.phone||job.phone,subject:`Yard Loop service scheduled: ${service}`,html,sms,consentConfirmed:true}); return NextResponse.json({ok:result.ok,result})}catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})} }
