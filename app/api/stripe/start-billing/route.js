export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { readJsonBlob, writeJsonBlob } from '../../../lib/blobJson'
import { stripeRequest, stripeMode } from '../../../lib/stripeApi'

const CRM_KEY = 'yard-loop-rep-portal.json'

export async function POST(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  let body = {}
  try{
    const raw = await req.text()
    if(raw.length > 10_000) return NextResponse.json({ ok:false, error:'Request body too large. Limit is 10 KB.' }, { status:413, headers:{'Cache-Control':'no-store'} })
    body = raw ? JSON.parse(raw) : {}
  }catch(e){
    return NextResponse.json({ ok:false, error:'Invalid JSON body.' }, { status:400, headers:{'Cache-Control':'no-store'} })
  }
  const customerId = String(body.customerId || '').trim()
  const subscriptionId = String(body.subscriptionId || '').trim()
  if(!customerId && !subscriptionId) return NextResponse.json({ ok:false, error:'Missing customerId or subscriptionId.' }, { status:400, headers:{'Cache-Control':'no-store'} })
  try{
    const crm = await readJsonBlob(CRM_KEY, { customers:[], activity:[] })
    const customer = (crm.customers||[]).find(c => (customerId && c.id===customerId) || (subscriptionId && c.stripeSubscriptionId===subscriptionId))
    const subId = subscriptionId || customer?.stripeSubscriptionId
    if(!subId) return NextResponse.json({ ok:false, error:'No Stripe subscription ID found for this customer yet. Complete card collection first, then wait for the Stripe webhook.' }, { status:400, headers:{'Cache-Control':'no-store'} })
    const updated = await stripeRequest(`subscriptions/${encodeURIComponent(subId)}`, { trial_end:'now' })
    if(customer){
      const now = new Date().toISOString()
      const customers = (crm.customers||[]).map(c => c.id===customer.id ? { ...c, billingStartPending:false, paymentStatus:'Billing started', billingStatus:'Billing started', firstChargeStartedAt:now, stripeSubscriptionId:subId, updatedAt:now } : c)
      const activity = [{ id:`stripe-start-${Date.now()}`, at:now, who:'Stripe', text:`Started billing for ${customer.name||customer.address||customer.id} after first service.` }, ...(crm.activity||[])].slice(0,500)
      await writeJsonBlob(CRM_KEY, { ...crm, customers, activity, savedAt:now })
    }
    return NextResponse.json({ ok:true, mode:stripeMode(), subscriptionId:updated.id, status:updated.status }, { headers:{'Cache-Control':'no-store'} })
  }catch(e){
    return NextResponse.json({ ok:false, error:e.message }, { status:500, headers:{'Cache-Control':'no-store'} })
  }
}
