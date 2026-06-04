export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { qbRequest } from '../../../lib/quickbooks'
export async function POST(req){ const denied=requireAdmin(req); if(denied)return denied; try{const p=await req.json(); const amount=Number(p.amount||0); if(!amount) throw new Error('Missing payout amount'); const body={PaymentType:'Cash',TotalAmt:amount,PrivateNote:`Yard Loop contractor payout: ${p.contractorName||''} ${p.serviceLabel||''}`,Line:[{Amount:amount,DetailType:'AccountBasedExpenseLineDetail',Description:p.serviceLabel||'Contractor service payout',AccountBasedExpenseLineDetail:{AccountRef:{value:p.accountId||'1'}}}]}; const j=await qbRequest('/purchase',{method:'POST',body}); return NextResponse.json({ok:true,expense:j.Purchase})}catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})} }
