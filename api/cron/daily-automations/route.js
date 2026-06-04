export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { refreshQbToken, readQbToken } from '../../../lib/quickbooks'
import { readJsonBlob } from '../../../lib/blobJson'
import { sendEmail } from '../../../lib/communications'
function authorized(req){return !process.env.CRON_SECRET || req.headers.get('authorization')===`Bearer ${process.env.CRON_SECRET}` || req.headers.get('x-cron-secret')===process.env.CRON_SECRET}
function ymd(d){return d.toISOString().slice(0,10)}
function daysUntil(dateStr){const d=new Date(dateStr); if(Number.isNaN(d.getTime()))return null; const today=new Date(); today.setHours(0,0,0,0); d.setHours(0,0,0,0); return Math.round((d-today)/86400000)}
function money(n){return `$${Math.round(Number(n||0)).toLocaleString()}`}
async function sendBillingNotices(){
  const crm=await readJsonBlob('yard-loop-rep-portal.json',{}).catch(()=>({}))
  const customers=(crm.customers||[]).filter(c=>String(c.status||'').toLowerCase()!=='cancelled')
  let sent=0, skipped=0
  for(const c of customers){
    const nextDate=c.nextBillingDate||c.stripeNextBillingDate||c.billingDate||c.nextChargeDate
    if(daysUntil(nextDate)!==3){skipped++; continue}
    if(!c.email){skipped++; continue}
    const html=`<p>Hi ${c.name||'there'},</p><p>Your Yard Loop plan of <b>${money(c.monthly)}</b> is scheduled to charge on <b>${ymd(new Date(nextDate))}</b>.</p><p>Questions? Reply to this email.</p>`
    const r=await sendEmail({to:c.email,subject:`Yard Loop billing notice — ${money(c.monthly)}`,html})
    if(r.ok)sent++; else skipped++
  }
  return {ok:true,sent,skipped}
}
export async function GET(req){ if(!authorized(req))return NextResponse.json({ok:false,error:'Unauthorized cron'},{status:401}); const site=process.env.NEXT_PUBLIC_SITE_URL||new URL(req.url).origin; const headers=process.env.CRON_SECRET?{authorization:`Bearer ${process.env.CRON_SECRET}`}:{ }; const results={renewal:null,payment:null,seasonal:null,billingNotices:null,quickbooks:null}; try{results.renewal=await fetch(`${site}/api/cron/renewal-check`,{headers,cache:'no-store'}).then(r=>r.json())}catch(e){results.renewal={ok:false,error:e.message}} try{results.payment=await fetch(`${site}/api/cron/payment-followup`,{headers,cache:'no-store'}).then(r=>r.json())}catch(e){results.payment={ok:false,error:e.message}} try{results.seasonal=await fetch(`${site}/api/cron/seasonal-campaigns`,{headers,cache:'no-store'}).then(r=>r.json())}catch(e){results.seasonal={ok:false,error:e.message}} try{results.billingNotices=await sendBillingNotices()}catch(e){results.billingNotices={ok:false,error:e.message}} try{const t=await readQbToken(); if(t?.refresh_token) { const expiresAt=Number(t.createdAt||0)+Number(t.expires_in||0)*1000; results.quickbooks=expiresAt-Date.now()<86400000 ? await refreshQbToken(t).then(x=>({ok:true,savedAt:x.savedAt})) : {ok:true,skipped:'Token still fresh'} }}catch(e){results.quickbooks={ok:false,error:e.message}} return NextResponse.json({ok:true,results}) }
