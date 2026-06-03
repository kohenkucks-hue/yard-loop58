export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { readSecureJson, writeSecureJson } from '../../../lib/secureJson'
import { readJsonBlob, writeJsonBlob } from '../../../lib/blobJson'
import { verifyStripeWebhook } from '../../../lib/stripeApi'

const EVENTS_KEY = 'yard-loop-stripe-events.json'
const CRM_KEY = 'yard-loop-rep-portal.json'

function stripeStatusFor(event){
  if(event.type === 'checkout.session.completed') return 'Card on file'
  if(event.type === 'customer.subscription.created') return 'Card on file'
  if(event.type === 'customer.subscription.updated') return 'Card on file'
  if(event.type === 'invoice.payment_succeeded' || event.type === 'invoice.paid') return 'Paid'
  if(event.type === 'customer.subscription.deleted') return 'Payment issue'
  if(event.type === 'invoice.payment_failed') return 'Payment failed'
  return ''
}

async function updateCrmBilling(event){
  const object = event.data?.object || {}
  const metadata = object.metadata || {}
  const targetId = metadata.customerId || metadata.leadId || ''
  const targetEmail = String(object.customer_email || metadata.customerEmail || '').toLowerCase()
  const status = stripeStatusFor(event)
  const stripeSubscriptionId = object.subscription || (String(event.type||'').startsWith('customer.subscription.') ? object.id : '')
  if(!status || (!targetId && !targetEmail)) return { updated:false, reason:'No target customer or status.' }
  const crm = await readJsonBlob(CRM_KEY, null)
  if(!crm || !Array.isArray(crm.customers)) return { updated:false, reason:'CRM data not found.' }
  let changed = false
  const customers = crm.customers.map(c=>{
    const idMatch = targetId && (c.id === targetId || c.customerId === targetId)
    const emailMatch = targetEmail && String(c.email || '').toLowerCase() === targetEmail
    if(idMatch || emailMatch){
      changed = true
      return { ...c, paymentStatus:status, billingStatus:status, stripeCustomerId:object.customer || c.stripeCustomerId || '', stripeSessionId:event.type==='checkout.session.completed' ? object.id : (c.stripeSessionId || ''), stripeSubscriptionId:stripeSubscriptionId || c.stripeSubscriptionId || '', billingStartPending:(metadata.delayedFirstCharge==='true'||c.billingStartPending) && !(String(event.type||'').startsWith('invoice.payment') || event.type === 'invoice.paid'), updatedAt:new Date().toISOString() }
    }
    return c
  })
  if(changed){
    const activity = [{ id:`stripe-${Date.now()}`, at:new Date().toISOString(), who:'Stripe Webhook', text:`Payment status updated to ${status}` }, ...(crm.activity||[])].slice(0,500)
    await writeJsonBlob(CRM_KEY, { ...crm, customers, activity, savedAt:new Date().toISOString() })
  }
  return { updated:changed }
}

export async function POST(req){
  const raw = await req.text()
  const signature = req.headers.get('stripe-signature')
  try{
    const event = await verifyStripeWebhook(raw, signature)
    const crmUpdate = await updateCrmBilling(event)
    const existing = await readSecureJson(EVENTS_KEY, [])
    const list = Array.isArray(existing) ? existing : []
    const safeEvent = {
      id:event.id,
      type:event.type,
      created:event.created,
      receivedAt:new Date().toISOString(),
      objectId:event.data?.object?.id || null,
      customer:event.data?.object?.customer || null,
      customer_email:event.data?.object?.customer_email || null,
      payment_status:event.data?.object?.payment_status || null,
      crmUpdated:crmUpdate.updated,
      metadata:event.data?.object?.metadata || {},
    }
    await writeSecureJson(EVENTS_KEY, [safeEvent, ...list].slice(0,500))
    return NextResponse.json({ received:true, crmUpdated:crmUpdate.updated })
  }catch(e){
    return NextResponse.json({ ok:false, error:e.message }, { status:400 })
  }
}
