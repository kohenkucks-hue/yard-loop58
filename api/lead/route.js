export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { hasBlobToken, readJsonBlob, writeJsonBlob } from '../../lib/blobJson'
import { sendLeadEmail } from '../../lib/leadEmail'

const LEADS_KEY = 'yard-loop-leads.json'
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 20
// Serverless note: this in-memory limiter resets on Vercel cold starts. For launch hardening, replace with Redis/Vercel KV.
const rateBuckets = globalThis.__yardLoopLeadRateBuckets || new Map()
globalThis.__yardLoopLeadRateBuckets = rateBuckets

function clientIp(req){
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

function rateLimited(req){
  const ip = clientIp(req)
  const now = Date.now()
  const bucket = rateBuckets.get(ip) || { count:0, resetAt: now + RATE_WINDOW_MS }
  if(now > bucket.resetAt){ bucket.count = 0; bucket.resetAt = now + RATE_WINDOW_MS }
  bucket.count += 1
  rateBuckets.set(ip, bucket)
  return bucket.count > RATE_MAX
}

async function readLeads(){
  const leads = await readJsonBlob(LEADS_KEY, [])
  return Array.isArray(leads) ? leads : []
}

export async function POST(req){
  if(rateLimited(req)) return NextResponse.json({ ok:false, error:'Too many lead submissions. Please try again later.' }, { status:429 })
  const raw = await req.text().catch(()=>'')
  if(raw.length > 25000) return NextResponse.json({ ok:false, error:'Request too large.' }, { status:413 })

  let body = {}
  try { body = raw ? JSON.parse(raw) : {} } catch {
    return NextResponse.json({ ok:false, error:'Invalid lead payload.' }, { status:400 })
  }

  // Honeypot fields: real users should never fill these.
  if(body.website || body.companyWebsite || body.url || body.fax || body._gotcha){
    return NextResponse.json({ ok:true, skipped:true })
  }

  const requiredFields = ['name','phone','email','address']
  const hasAnyRequired = requiredFields.some(k => String(body[k] || '').trim().length > 0)
  if(!hasAnyRequired) return NextResponse.json({ ok:false, error:'Lead must include at least one contact field.' }, { status:400 })

  const lead = { id:crypto.randomUUID(), date:new Date().toISOString(), status:body.status||'New', notes:body.notes||'', ...body }

  let stored = false
  let storageNote = ''
  let email = null

  try {
    if(hasBlobToken()){
      const leads = await readLeads()
      await writeJsonBlob(LEADS_KEY, [lead, ...leads])
      stored = true
    } else {
      storageNote = 'Blob not connected. Lead accepted but not stored in dashboard.'
    }
  } catch(e) {
    storageNote = 'Lead accepted, but Blob save failed: ' + e.message
  }

  try {
    email = await sendLeadEmail(lead)
  } catch(e) {
    email = { ok:false, note:'Email notification failed: ' + e.message }
  }

  return NextResponse.json({ ok:true, lead, stored, emailSent:Boolean(email?.ok), email, note:storageNote || undefined })
}
