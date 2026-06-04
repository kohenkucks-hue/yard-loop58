export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { qbRequest, customerToQb } from '../../../lib/quickbooks'
import { readJsonBlob, writeJsonBlob } from '../../../lib/blobJson'
const CRM_KEY='yard-loop-rep-portal.json'
export async function POST(req){
  const denied=requireAdmin(req); if(denied)return denied
  try{
    const {customer}=await req.json(); if(!customer) throw new Error('Missing customer')
    const j=await qbRequest('/customer',{method:'POST',body:customerToQb(customer)})
    const qbCustomer=j.Customer||{}
    const crm=await readJsonBlob(CRM_KEY,null).catch(()=>null)
    if(crm?.customers&&customer.id&&qbCustomer.Id){
      const customers=crm.customers.map(c=>c.id===customer.id?{...c,qbCustomerId:qbCustomer.Id,quickbooksCustomerId:qbCustomer.Id,qbSyncedAt:new Date().toISOString(),updatedAt:new Date().toISOString()}:c)
      const activity=[{id:`qb-${Date.now()}`,at:new Date().toISOString(),who:'QuickBooks',text:`QuickBooks customer synced for ${customer.name||customer.email||customer.id}`},...(crm.activity||[])].slice(0,500)
      await writeJsonBlob(CRM_KEY,{...crm,customers,activity,savedAt:new Date().toISOString()})
    }
    return NextResponse.json({ok:true,quickbooksCustomer:qbCustomer})
  }catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})}
}
