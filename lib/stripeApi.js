export function stripeConfigured(){
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function stripeMode(){
  const key = process.env.STRIPE_SECRET_KEY || ''
  if(key.startsWith('sk_live_')) return 'live'
  if(key.startsWith('sk_test_')) return 'test'
  return key ? 'unknown' : 'missing'
}

export async function stripeRequest(path, params){
  if(!stripeConfigured()) throw new Error('Missing STRIPE_SECRET_KEY in Vercel.')
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method:'POST',
    headers:{
      'Authorization':`Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type':'application/x-www-form-urlencoded',
    },
    body:new URLSearchParams(params),
    cache:'no-store'
  })
  const json = await res.json().catch(()=>({}))
  if(!res.ok) throw new Error(json.error?.message || `Stripe request failed (${res.status})`)
  return json
}

export async function verifyStripeWebhook(rawBody, signature){
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if(!secret) throw new Error('Missing STRIPE_WEBHOOK_SECRET in Vercel.')
  if(!signature) throw new Error('Missing stripe-signature header.')
  const parts = Object.fromEntries(signature.split(',').map(v=>v.split('=')))
  const timestamp = parts.t
  const received = parts.v1
  if(!timestamp || !received) throw new Error('Invalid stripe-signature header.')
  const timestampNumber = Number(timestamp)
  if(!Number.isFinite(timestampNumber)) throw new Error('Invalid stripe-signature timestamp.')
  const age = Math.floor(Date.now() / 1000) - timestampNumber
  if(age > 300 || age < -300) throw new Error('Stripe webhook timestamp outside allowed tolerance.')
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign'])
  const signedPayload = `${timestamp}.${rawBody}`
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload))
  const expected = Array.from(new Uint8Array(mac)).map(b=>b.toString(16).padStart(2,'0')).join('')
  const e = Buffer.from(expected, 'hex')
  const r = Buffer.from(received, 'hex')
  if(e.length !== r.length) throw new Error('Stripe webhook signature length mismatch.')
  let diff = 0
  for(let i=0;i<e.length;i++) diff |= e[i] ^ r[i]
  if(diff !== 0) throw new Error('Stripe webhook signature verification failed.')
  return JSON.parse(rawBody)
}
