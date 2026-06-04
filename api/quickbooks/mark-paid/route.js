export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { qbRequest } from '../../../lib/quickbooks'
export async function POST(req){ const denied=requireAdmin(req); if(denied)return denied; try{const {invoiceId,customerId,amount}=await req.json(); if(!invoiceId||!customerId) throw new Error('Missing invoiceId or customerId'); const j=await qbRequest('/payment',{method:'POST',body:{CustomerRef:{value:String(customerId)},TotalAmt:Number(amount||0),Line:[{Amount:Number(amount||0),LinkedTxn:[{TxnId:String(invoiceId),TxnType:'Invoice'}]}]}}); return NextResponse.json({ok:true,payment:j.Payment})}catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})} }
