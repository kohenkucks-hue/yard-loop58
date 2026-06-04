export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { readSecureJson, writeSecureJson } from '../../../lib/secureJson'
import { readJsonBlob, writeJsonBlob } from '../../../lib/blobJson'
import { verifyStripeWebhook } from '../../../lib/stripeApi'
import { qbRequest } from '../../../lib/quickbooks'

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
function amt(n){return Math.round(Number(n||0)*100)/100}
function stripeAmountDollars(object={}){return amt((Number(object.amount_paid||object.amount_due||object.amount_total||0)||0)/100)}
async function createQuickBooksInvoiceAndPayment(customer={}, object={}){
  try{
    const qbCustomerId=customer.qbCustomerId||customer.quickbooksCustomerId
    if(!qbCustomerId) return {ok:false,skipped:'Customer has no QuickBooks ID yet.'}
    const amount=stripeAmountDollars(object)||Number(customer.monthly||0)
    if(!amount) return {ok:false,skipped:'No payment amount found.'}
    const invoice=await qbRequest('/invoice',{method:'POST',body:{
      CustomerRef:{value:String(qbCustomerId)},
      Line:[{DetailType:'SalesItemLineDetail',Amount:amount,Description:`Yard Loop monthly plan: ${(customer.selectedServices||[]).join(', ')}`,SalesItemLineDetail:{Qty:1,UnitPrice:amount,ItemRef:{value:'1',name:'Services'}}}],
      PrivateNote:`Auto-created from Stripe webhook ${object.id||''} for Yard Loop customer ${customer.id||customer.name||''}`
    }})
    const invoiceId=invoice?.Invoice?.Id
    if(invoiceId){
      await qbRequest('/payment',{method:'POST',body:{CustomerRef:{value:String(qbCustomerId)},TotalAmt:amount,Line:[{Amount:amount,LinkedTxn:[{TxnId:String(invoiceId),TxnType:'Invoice'}]}]}})
    }
    return {ok:true,invoiceId}
  }catch(e){return {ok:false,error:e.message}}
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
  let updatedCustomer = null
  const customers = crm.customers.map(c=>{
    const idMatch = targetId && (c.id === targetId || c.customerId === targetId)
    const emailMatch = targetEmail && String(c.email || '').toLowerCase() === targetEmail
    if(idMatch || emailMatch){
      changed = true
      updatedCustomer = { ...c, paymentStatus:status, billingStatus:status, stripeCustomerId:object.customer || c.stripeCustomerId || '', stripeSessionId:event.type==='checkout.session.completed' ? object.id : (c.stripeSessionId || ''), stripeSubscriptionId:stripeSubscriptionId || c.stripeSubscriptionId || '', lastStripeEventId:event.id, lastStripeEventType:event.type, lastPaymentAmount:stripeAmountDollars(object)||c.lastPaymentAmount||0, lastPaymentAt:new Date().toISOString(), billingStartPending:(metadata.delayedFirstCharge==='true'||c.billingStartPending) && !(String(event.type||'').startsWith('invoice.payment') || event.type === 'invoice.paid'), updatedAt:new Date().toISOString() }
      return updatedCustomer
    }
    return c
  })
  let qbResult = null
  if(changed && (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.paid')) qbResult = await createQuickBooksInvoiceAndPayment(updatedCustomer, object)
  if(changed){
    const activity = [{ id:`stripe-${Date.now()}`, at:new Date().toISOString(), who:'Stripe Webhook', text:`Payment status updated to ${status}${qbResult?.ok?' and QuickBooks invoice/payment was recorded.':qbResult?.error?' (QuickBooks skipped: '+qbResult.error+')':''}` }, ...(crm.activity||[])].slice(0,500)
    await writeJsonBlob(CRM_KEY, { ...crm, customers, activity, savedAt:new Date().toISOString() })
  }
  return { updated:changed, customerId:updatedCustomer?.id||'', quickbooks:qbResult }
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
      amount_paid:event.data?.object?.amount_paid || null,
      amount_due:event.data?.object?.amount_due || null,
      amount_total:event.data?.object?.amount_total || null,
      payment_status:event.data?.object?.payment_status || null,
      crmUpdated:crmUpdate.updated,
      quickbooks:crmUpdate.quickbooks || null,
      metadata:event.data?.object?.metadata || {},
    }
    await writeSecureJson(EVENTS_KEY, [safeEvent, ...list].slice(0,500))
    return NextResponse.json({ received:true, crmUpdated:crmUpdate.updated, quickbooks:crmUpdate.quickbooks||null })
  }catch(e){
    return NextResponse.json({ ok:false, error:e.message }, { status:400 })
  }
}
