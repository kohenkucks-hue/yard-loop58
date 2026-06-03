export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { stripeRequest, stripeMode } from '../../../lib/stripeApi'

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
  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yard-loop.com'
  const amount = Number(body.amountCents || body.amount || 0)
  const priceId = body.priceId || process.env.STRIPE_MONTHLY_PRICE_ID
  try{
    const delayFirstCharge = Boolean(body.delayFirstCharge || body.collectCardUntilFirstService)
    const trialDaysRaw = Number(body.trialDays || process.env.STRIPE_FIRST_SERVICE_TRIAL_DAYS || 30)
    const trialDays = Number.isFinite(trialDaysRaw) ? Math.max(1, Math.min(90, Math.round(trialDaysRaw))) : 30
    const params = {
      mode: priceId ? 'subscription' : 'payment',
      success_url: body.successUrl || `${origin}/thank-you?stripe=success`,
      cancel_url: body.cancelUrl || `${origin}/estimate?stripe=cancelled`,
      'metadata[source]':'yard-loop-crm',
      'metadata[leadId]': body.leadId || '',
      'metadata[customerId]': body.customerId || body.leadId || '',
      'metadata[customerEmail]': body.customerEmail || '',
      'metadata[customerName]': body.customerName || body.name || '',
      'metadata[delayedFirstCharge]': delayFirstCharge ? 'true' : 'false',
    }
    if(priceId && delayFirstCharge){
      params.payment_method_collection = 'always'
      params['subscription_data[trial_period_days]'] = String(trialDays)
      params['subscription_data[metadata][source]'] = 'yard-loop-crm'
      params['subscription_data[metadata][customerId]'] = body.customerId || body.leadId || ''
      params['subscription_data[metadata][leadId]'] = body.leadId || ''
      params['subscription_data[metadata][customerEmail]'] = body.customerEmail || ''
      params['subscription_data[metadata][customerName]'] = body.customerName || body.name || ''
      params['subscription_data[metadata][delayedFirstCharge]'] = 'true'
    }
    if(body.customerEmail) params.customer_email = body.customerEmail
    if(priceId){
      params['line_items[0][price]'] = priceId
      params['line_items[0][quantity]'] = '1'
    }else{
      if(!amount || amount < 50) throw new Error('amountCents must be at least 50 for one-time checkout sessions.')
      params['line_items[0][price_data][currency]'] = 'usd'
      params['line_items[0][price_data][product_data][name]'] = body.name || 'Yard Loop Service'
      params['line_items[0][price_data][unit_amount]'] = String(amount)
      params['line_items[0][quantity]'] = '1'
    }
    const session = await stripeRequest('checkout/sessions', params)
    return NextResponse.json({ ok:true, mode:stripeMode(), checkoutUrl:session.url, sessionId:session.id }, { headers:{'Cache-Control':'no-store'} })
  }catch(e){
    return NextResponse.json({ ok:false, error:e.message }, { status:500, headers:{'Cache-Control':'no-store'} })
  }
}
