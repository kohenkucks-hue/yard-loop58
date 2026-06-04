export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { qbRequest } from '../../../lib/quickbooks'
function amt(n){return Math.round(Number(n||0)*100)/100}
export async function POST(req){ const denied=requireAdmin(req); if(denied)return denied; try{const {customer={},monthly,services=[]}=await req.json(); if(!customer.qbCustomerId&&!customer.quickbooksCustomerId) throw new Error('Customer needs qbCustomerId. Run QuickBooks customer sync first.'); const CustomerRef={value:String(customer.qbCustomerId||customer.quickbooksCustomerId)}; const Line=[{DetailType:'SalesItemLineDetail',Amount:amt(monthly||customer.monthly),Description:`Yard Loop monthly plan: ${(services||customer.selectedServices||[]).join(', ')}`,SalesItemLineDetail:{Qty:1,UnitPrice:amt(monthly||customer.monthly),ItemRef:{value:'1',name:'Services'}}}]; const j=await qbRequest('/invoice',{method:'POST',body:{CustomerRef,Line,PrivateNote:`Yard Loop CRM invoice for ${customer.id||customer.name||''}`}}); return NextResponse.json({ok:true,invoice:j.Invoice})}catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})} }
