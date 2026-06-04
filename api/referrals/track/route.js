export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { readJsonBlob, writeJsonBlob } from '../../../lib/blobJson'
import { findReferralOwner, referralReward } from '../../../lib/referrals'
const CRM_KEY='yard-loop-rep-portal.json'
export async function POST(req){ try{const {referralCode,leadId,customerId}=await req.json(); const crm=await readJsonBlob(CRM_KEY,{}); const owner=findReferralOwner(crm.customers||[],referralCode); if(!owner) return NextResponse.json({ok:false,error:'Referral code not found'},{status:404}); const row={id:`ref_${Date.now()}`,referralCode:String(referralCode).toUpperCase(),referringCustomerId:owner.id,referredLeadId:leadId||'',referredCustomerId:customerId||'',status:customerId?'Converted':'Pending',reward:referralReward(crm.settings||{}),createdAt:new Date().toISOString(),convertedAt:customerId?new Date().toISOString():''}; await writeJsonBlob(CRM_KEY,{...crm,referrals:[row,...(crm.referrals||[])],savedAt:new Date().toISOString()}); return NextResponse.json({ok:true,referral:row})}catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})} }
