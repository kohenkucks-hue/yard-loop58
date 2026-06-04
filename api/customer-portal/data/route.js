export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { readJsonBlob } from '../../../lib/blobJson'
import { readSecureJson } from '../../../lib/secureJson'
const CRM_KEY='yard-loop-rep-portal.json', EVENTS_KEY='yard-loop-stripe-events.json'
function amountFrom(e){return Number(e.amount_paid||e.amount_due||e.amount_total||e.metadata?.monthly||0)/100 || Number(e.metadata?.monthly||0)}
function publicCustomer(c={}){ const {pin,password,cloudPassword,ownerNote,internalNotes,...safe}=c; return safe }
export async function GET(req){
  const token=new URL(req.url).searchParams.get('token')||''
  const crm=await readJsonBlob(CRM_KEY,{})
  const session=(crm.portalSessions||[]).find(s=>s.token===token && new Date(s.expiresAt)>new Date())
  if(!session) return NextResponse.json({ok:false,error:'Portal link expired or invalid.'},{status:401})
  const customer=(crm.customers||[]).find(c=>c.id===session.customerId)
  if(!customer)return NextResponse.json({ok:false,error:'Customer not found'},{status:404})
  const jobs=(crm.jobs||[]).filter(j=>j.customerId===customer.id)
  const events=await readSecureJson(EVENTS_KEY,[]).catch(()=>[])
  const paymentHistory=(Array.isArray(events)?events:[]).filter(e=>e.metadata?.customerId===customer.id || e.customer===customer.stripeCustomerId || String(e.customer_email||e.metadata?.customerEmail||'').toLowerCase()===String(customer.email||'').toLowerCase()).map(e=>({id:e.id,type:e.type,date:e.receivedAt||new Date(Number(e.created||0)*1000).toISOString(),amount:amountFrom(e),status:e.payment_status||(/failed/.test(e.type)?'failed':/succeeded|paid|completed/.test(e.type)?'paid':'event')})).slice(0,24)
  return NextResponse.json({ok:true,customer:publicCustomer(customer),jobs,services:customer.selectedServices||[],paymentHistory,lifetimeValue:paymentHistory.filter(p=>p.status==='paid'||/paid|succeeded|completed/.test(p.type||'')).reduce((a,p)=>a+Number(p.amount||0),0),settings:{companyName:crm.settings?.companyName,companyEmail:crm.settings?.companyEmail,companyPhone:crm.settings?.companyPhone}})
}
