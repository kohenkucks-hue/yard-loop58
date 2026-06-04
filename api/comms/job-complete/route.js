export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { sendEmailSms, esc } from '../../../lib/communications'
export async function POST(req){ const denied=requireAdmin(req); if(denied)return denied; try{const {customer={},job={}}=await req.json(); const photo=(job.afterPhoto||job.afterPhotos?.[0]?.url||job.afterPhotos?.[0]||''); const html=`<p>Hi ${esc(customer.name||job.customerName||'there')},</p><p>Your Yard Loop ${esc(job.service||'service')} was completed today.</p>${photo?`<p><a href="${esc(photo)}">View completion photo</a></p>`:''}<p>Thanks for using Yard Loop.</p>`; const sms=`Yard Loop: Your ${job.service||'service'} was completed today.${photo?' Photo: '+photo:''}`; const result=await sendEmailSms({email:customer.email||job.email,phone:customer.phone||job.phone,subject:`Yard Loop service completed: ${job.service||'Service'}`,html,sms,consentConfirmed:true}); return NextResponse.json({ok:result.ok,result})}catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})} }
