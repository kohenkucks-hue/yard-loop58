export const dynamic = 'force-dynamic'
import crypto from 'crypto'
import { readJsonBlob } from '../../../lib/blobJson.js'
import { stripeRequest, stripeMode } from '../../../lib/stripeApi.js'

const checkoutAttempts = globalThis.__yardLoopCheckoutAttempts || (globalThis.__yardLoopCheckoutAttempts = new Map())

function rateLimit(req){
  const ip=(req.headers.get('x-forwarded-for')||req.headers.get('x-real-ip')||'unknown').split(',')[0].trim()
  const now=Date.now(), windowMs=60*60*1000
  const row=checkoutAttempts.get(ip)||{count:0,start:now}
  if(now-row.start>windowMs){row.count=0;row.start=now}
  row.count+=1;checkoutAttempts.set(ip,row)
  return row.count<=20
}

function failedAttemptAllowed(req){
  const ip=(req.headers.get('x-forwarded-for')||req.headers.get('x-real-ip')||'unknown').split(',')[0].trim()+':failed'
  const now=Date.now(), windowMs=60*60*1000
  const row=checkoutAttempts.get(ip)||{count:0,start:now}
  if(now-row.start>windowMs){row.count=0;row.start=now}
  row.count+=1;checkoutAttempts.set(ip,row)
  return row.count<=5
}

// V25: timing-safe string comparison to prevent timing oracle attacks on tokens
function timingSafeStringEqual(a='', b=''){
  try {
    const bufA = Buffer.from(String(a), 'utf8')
    const bufB = Buffer.from(String(b), 'utf8')
    if(bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export async function POST(req){
  if(!rateLimit(req)) return Response.json({ok:false,error:'Too many checkout attempts. Please try again later.'},{status:429})

  // V28: public endpoint defense-in-depth; cap body before JSON parsing.
  const raw = await req.text().catch(()=>'')
  if(raw.length > 5 * 1024) return Response.json({ok:false,error:'Checkout request too large.'},{status:413})
  let checkoutBody = {}
  try { checkoutBody = raw ? JSON.parse(raw) : {} } catch {
    return Response.json({ok:false,error:'Invalid checkout request.'},{status:400})
  }
  const {customerId='',token=''}=checkoutBody

  if(!customerId || !token) {
    if(!failedAttemptAllowed(req)) return Response.json({ok:false,error:'Too many invalid checkout attempts. Please try again later.'},{status:429})
    return Response.json({ok:false,error:'Invalid or expired checkout link.'},{status:403})
  }

  const crm=await readJsonBlob('yard-loop-rep-portal.json',{customers:[]})
  const customer=(crm.customers||[]).find(c=>
    c.id===customerId && timingSafeStringEqual(c.checkoutToken, token)
  )

  if(!customer){
    if(!failedAttemptAllowed(req)) return Response.json({ok:false,error:'Too many invalid checkout attempts. Please try again later.'},{status:429})
    return Response.json({ok:false,error:'Invalid or expired checkout link.'},{status:403})
  }

  if(customer.checkoutTokenExpiresAt && Date.now()>new Date(customer.checkoutTokenExpiresAt).getTime())
    return Response.json({ok:false,error:'This checkout link has expired. Please contact Yard Loop for a new payment link.'},{status:403})

  const origin=req.headers.get('origin')||process.env.NEXT_PUBLIC_SITE_URL||'https://www.yard-loop.com'
  const amount=Math.round(Number(customer.monthly||0)*100)
  const priceId=process.env.STRIPE_MONTHLY_PRICE_ID
  const delayFirstCharge = Boolean(customer.delayFirstCharge || customer.collectCardUntilFirstService)
  const trialDaysRaw = Number(customer.trialDays || process.env.STRIPE_FIRST_SERVICE_TRIAL_DAYS || 30)
  const trialDays = Number.isFinite(trialDaysRaw) ? Math.max(1, Math.min(90, Math.round(trialDaysRaw))) : 30
  const params={
    mode:priceId?'subscription':'payment',
    success_url:`${origin}/thank-you?stripe=success`,
    cancel_url:`${origin}/checkout?customerId=${encodeURIComponent(customerId)}&token=${encodeURIComponent(token)}`,
    'metadata[source]':'yard-loop-public-checkout',
    'metadata[customerId]':customer.id,
    'metadata[customerEmail]':customer.email||'',
    'metadata[customerName]':customer.name||'',
    'metadata[delayedFirstCharge]':delayFirstCharge?'true':'false'
  }
  if(priceId && delayFirstCharge){
    params.payment_method_collection='always'
    params['subscription_data[trial_period_days]']=String(trialDays)
    params['subscription_data[metadata][source]']='yard-loop-public-checkout'
    params['subscription_data[metadata][customerId]']=customer.id
    params['subscription_data[metadata][customerEmail]']=customer.email||''
    params['subscription_data[metadata][customerName]']=customer.name||''
    params['subscription_data[metadata][delayedFirstCharge]']='true'
  }
  if(customer.email) params.customer_email=customer.email
  if(priceId){
    params['line_items[0][price]']=priceId
    params['line_items[0][quantity]']='1'
  } else {
    if(!amount||amount<50) return Response.json({ok:false,error:'Customer monthly amount is too low for checkout.'},{status:400})
    params['line_items[0][price_data][currency]']='usd'
    params['line_items[0][price_data][product_data][name]']='Yard Loop Monthly Plan'
    params['line_items[0][price_data][unit_amount]']=String(amount)
    params['line_items[0][quantity]']='1'
  }

  try{
    const session=await stripeRequest('checkout/sessions',params)
    return Response.json({ok:true,mode:stripeMode(),checkoutUrl:session.url})
  }catch(e){
    console.error('Public Stripe checkout failed', e)
    return Response.json({ok:false,error:'Secure checkout is temporarily unavailable. Please contact Yard Loop to complete payment setup.'},{status:502})
  }
}
