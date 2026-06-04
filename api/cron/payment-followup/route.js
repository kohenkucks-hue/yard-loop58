export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { readSecureJson } from '../../../lib/secureJson'
import { readJsonBlob } from '../../../lib/blobJson'
import { sendEmailSms, esc } from '../../../lib/communications'
const CRM_KEY='yard-loop-rep-portal.json', EVENTS_KEY='yard-loop-stripe-events.json'
function authorized(req){return !process.env.CRON_SECRET || req.headers.get('authorization')===`Bearer ${process.env.CRON_SECRET}` || req.headers.get('x-cron-secret')===process.env.CRON_SECRET}
export async function GET(req){ if(!authorized(req))return NextResponse.json({ok:false,error:'Unauthorized cron'},{status:401}); const crm=await readJsonBlob(CRM_KEY,{}); const events=await readSecureJson(EVENTS_KEY,[]).catch(()=>[]); let sent=0; const recent=(events||[]).filter(e=>/invoice.payment_failed/.test(e.type||'') && Date.now()-new Date(e.receivedAt||0).getTime()<3*86400000); for(const e of recent){const id=e.metadata?.customerId; const email=String(e.customer_email||e.metadata?.customerEmail||'').toLowerCase(); const c=(crm.customers||[]).find(x=>x.id===id||String(x.email||'').toLowerCase()===email); if(!c) continue; const html=`<p>Hi ${esc(c.name)},</p><p>Your Yard Loop payment did not go through. Please update your payment method or reply to this email for help.</p>`; await sendEmailSms({email:c.email,phone:c.phone,subject:'Yard Loop payment needs attention',html,sms:'Yard Loop: Your payment did not go through. Please update your payment method or reply for help.',consentConfirmed:true}); sent++} return NextResponse.json({ok:true,failedPayments:recent.length,alertsSent:sent}) }
