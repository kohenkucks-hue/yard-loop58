export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { readJsonBlob, writeJsonBlob } from '../../../lib/blobJson'
import { makeReferralCode } from '../../../lib/referrals'
const CRM_KEY='yard-loop-rep-portal.json'
export async function POST(req){ const denied=requireAdmin(req); if(denied)return denied; try{const {customerId}=await req.json(); const crm=await readJsonBlob(CRM_KEY,{}); const existing=(crm.customers||[]).map(c=>c.referralCode).filter(Boolean); let code=''; const customers=(crm.customers||[]).map(c=>{if(c.id===customerId){code=c.referralCode||makeReferralCode(c.name,existing); return {...c,referralCode:code}} return c}); if(!code) throw new Error('Customer not found'); await writeJsonBlob(CRM_KEY,{...crm,customers,savedAt:new Date().toISOString()}); return NextResponse.json({ok:true,referralCode:code})}catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})} }
