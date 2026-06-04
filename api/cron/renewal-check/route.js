export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { readJsonBlob, writeJsonBlob } from '../../../lib/blobJson'
import { sendEmailSms, esc } from '../../../lib/communications'
const CRM_KEY='yard-loop-rep-portal.json'
function authorized(req){return !process.env.CRON_SECRET || req.headers.get('authorization')===`Bearer ${process.env.CRON_SECRET}` || req.headers.get('x-cron-secret')===process.env.CRON_SECRET}
function daysUntil(d){return d?Math.ceil((new Date(d).getTime()-Date.now())/86400000):9999}
export async function GET(req){ if(!authorized(req))return NextResponse.json({ok:false,error:'Unauthorized cron'},{status:401}); const crm=await readJsonBlob(CRM_KEY,{}); let sent=0; const activity=[...(crm.activity||[])]; for(const c of (crm.customers||[]).filter(c=>/active|signed|scheduled/i.test(c.status||''))){const d=daysUntil(c.renewalDate); if([60,30,7].includes(d)){const subject=`Yard Loop renewal reminder — ${d} days`; const html=`<p>Hi ${esc(c.name)},</p><p>Your Yard Loop plan renews in <b>${d} days</b>.</p><p>Current monthly plan: <b>$${Math.round(Number(c.monthly||0)).toLocaleString()}</b>. Reply to discuss changes.</p>`; await sendEmailSms({email:c.email,phone:d<=30?c.phone:'',subject,html,sms:`Yard Loop: Your plan renews in ${d} days. Reply or call with questions.`,consentConfirmed:true}); activity.unshift({id:`renew-${Date.now()}-${c.id}`,at:new Date().toISOString(),who:'Cron',text:`Renewal reminder ${d} days sent to ${c.name}`}); sent++}} await writeJsonBlob(CRM_KEY,{...crm,activity:activity.slice(0,1000),savedAt:new Date().toISOString()}).catch(()=>{}); return NextResponse.json({ok:true,sent}) }
