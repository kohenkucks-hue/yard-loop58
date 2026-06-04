export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { readJsonBlob } from '../../../lib/blobJson'
import { readSecureJson } from '../../../lib/secureJson'
const CRM_KEY='yard-loop-rep-portal.json', EVENTS_KEY='yard-loop-stripe-events.json'
export async function POST(req){ const denied=requireAdmin(req); if(denied)return denied; try{const {customerId,noticeDate}=await req.json(); const crm=await readJsonBlob(CRM_KEY,{}); const c=(crm.customers||[]).find(x=>x.id===customerId); if(!c) throw new Error('Customer not found'); const events=await readSecureJson(EVENTS_KEY,[]).catch(()=>[]); const paid=(events||[]).filter(e=>e.metadata?.customerId===customerId && /paid|succeeded|completed/.test(e.type||'')).reduce((a,e)=>a+(Number(e.amount_paid||e.amount_total||e.metadata?.monthly||0)/100||Number(e.metadata?.monthly||0)),0); const start=new Date(c.createdAt||c.signedAt||Date.now()); const end=new Date(noticeDate||Date.now()); const months=Math.max(1,Math.ceil((end-start)/(1000*60*60*24*30))); const shouldHavePaid=months*Number(c.monthly||0); const balance=Math.round((shouldHavePaid-paid)*100)/100; return NextResponse.json({ok:true,customerId,monthsElapsed:months,monthly:Number(c.monthly||0),shouldHavePaid,paid,balanceOwed:Math.max(0,balance),creditDue:balance<0?Math.abs(balance):0})}catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})} }
