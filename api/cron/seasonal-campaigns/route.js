export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { readJsonBlob, writeJsonBlob } from '../../../lib/blobJson'
import { sendEmailSms, esc } from '../../../lib/communications'
const CRM_KEY='yard-loop-rep-portal.json'
function authorized(req){return !process.env.CRON_SECRET || req.headers.get('authorization')===`Bearer ${process.env.CRON_SECRET}` || req.headers.get('x-cron-secret')===process.env.CRON_SECRET}
export async function GET(req){ if(!authorized(req))return NextResponse.json({ok:false,error:'Unauthorized cron'},{status:401}); const crm=await readJsonBlob(CRM_KEY,{}); const today=new Date().toISOString().slice(0,10); let sent=0; const campaigns=(crm.campaigns||[]).map(c=>{ if(c.sentAt||c.sendDate>today) return c; const targets=(crm.customers||[]).filter(x=>(!c.targetStatus||c.targetStatus==='All'||x.status===c.targetStatus)); targets.forEach(x=>sendEmailSms({email:/email|both/i.test(c.channel||'both')?x.email:'',phone:/sms|both/i.test(c.channel||'both')?x.phone:'',subject:c.name||'Yard Loop update',html:`<p>Hi ${esc(x.name)},</p><p>${esc(c.message)}</p>`,sms:String(c.message||'').slice(0,300),consentConfirmed:true}).catch(()=>{})); sent+=targets.length; return {...c,sentAt:new Date().toISOString(),recipientCount:targets.length} }); await writeJsonBlob(CRM_KEY,{...crm,campaigns,savedAt:new Date().toISOString()}).catch(()=>{}); return NextResponse.json({ok:true,sent}) }
