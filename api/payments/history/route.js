export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { readSecureJson } from '../../../lib/secureJson'
const EVENTS_KEY='yard-loop-stripe-events.json'
function amountFrom(e){return Number(e.amount_paid||e.amount_due||e.amount_total||e.metadata?.monthly||e.metadata?.amount||0)/100 || Number(e.metadata?.monthly||0)}
export async function GET(req){ const denied=requireAdmin(req); if(denied)return denied; const u=new URL(req.url); const customerId=u.searchParams.get('customerId')||''; const email=String(u.searchParams.get('email')||'').toLowerCase(); const events=await readSecureJson(EVENTS_KEY,[]).catch(()=>[]); const rows=(Array.isArray(events)?events:[]).filter(e=>{const m=e.metadata||{}; return (!customerId||m.customerId===customerId||e.customer===customerId) && (!email||String(e.customer_email||m.customerEmail||'').toLowerCase()===email)}).map(e=>({id:e.id,type:e.type,date:e.receivedAt||new Date(Number(e.created||0)*1000).toISOString(),amount:amountFrom(e),status:e.payment_status||(/failed/.test(e.type)?'failed':/succeeded|paid|completed/.test(e.type)?'paid':'event'),customer:e.customer,customerEmail:e.customer_email}))
 return NextResponse.json({ok:true,history:rows,lifetimeValue:rows.filter(r=>r.status==='paid'||r.type?.includes('succeeded')||r.type?.includes('paid')).reduce((a,r)=>a+Number(r.amount||0),0)},{headers:{'Cache-Control':'no-store'}}) }
