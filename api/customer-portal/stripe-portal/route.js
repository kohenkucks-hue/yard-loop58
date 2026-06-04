export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { readJsonBlob } from '../../../lib/blobJson'
import { stripeRequest } from '../../../lib/stripeApi'
const CRM_KEY='yard-loop-rep-portal.json'
export async function POST(req){
  try{
    const {token}=await req.json()
    const crm=await readJsonBlob(CRM_KEY,{})
    const session=(crm.portalSessions||[]).find(s=>s.token===token && new Date(s.expiresAt)>new Date())
    if(!session) return NextResponse.json({ok:false,error:'Portal link expired or invalid.'},{status:401})
    const customer=(crm.customers||[]).find(c=>c.id===session.customerId)
    if(!customer?.stripeCustomerId) return NextResponse.json({ok:false,error:'No Stripe customer is linked yet.'},{status:400})
    const returnUrl=`${process.env.NEXT_PUBLIC_SITE_URL||'https://www.yard-loop.com'}/customer?token=${encodeURIComponent(token)}`
    const portal=await stripeRequest('billing_portal/sessions',{customer:customer.stripeCustomerId,return_url:returnUrl})
    return NextResponse.json({ok:true,url:portal.url})
  }catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})}
}
