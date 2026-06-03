export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { readSecureJson, writeSecureJson } from '../../../lib/secureJson'
import { readJsonBlob, writeJsonBlob } from '../../../lib/blobJson'
import { jobberWebhookSecretConfigured, jobberWebhookStrictMode } from '../../../lib/jobber'

const EVENTS_KEY = 'yard-loop-jobber-events.json'
const CRM_KEY = 'yard-loop-rep-portal.json'

function safeBody(body={}){
  return {
    id: body.id || body.eventId || `jobber-${Date.now()}`,
    topic: body.topic || body.event || body.type || 'jobber.webhook',
    objectId: body.objectId || body.resourceId || body.data?.id || null,
    receivedAt: new Date().toISOString(),
    payload: body,
  }
}

function timingSafeEqualString(a='', b='', encoding='utf8'){
  const left = Buffer.from(String(a), encoding)
  const right = Buffer.from(String(b), encoding)
  if(left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

function verifyJobberWebhook(req, rawBody){
  const secret = process.env.JOBBER_WEBHOOK_SECRET || ''
  if(!secret){
    // V25: warn on missing secret; reject in strict mode
    if(jobberWebhookStrictMode()){
      return false
    }
    // Non-strict (test/dev): allow through with a console warning
    console.warn('[Yard Loop] JOBBER_WEBHOOK_SECRET is not set. Webhook accepted without verification (non-strict mode). Set JOBBER_WEBHOOK_VERIFIED_MODE=strict for production.')
    return true
  }

  const suppliedHmac = req.headers.get('x-jobber-hmac-sha256') || req.headers.get('x-jobber-signature') || ''
  if(suppliedHmac){
    const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
    return timingSafeEqualString(expected, suppliedHmac)
  }

  // Backward-compatible local/test fallback. Real Jobber webhooks should send x-jobber-hmac-sha256.
  const suppliedPlain = req.headers.get('x-jobber-webhook-secret') || req.headers.get('x-yard-loop-webhook-secret') || ''
  return Boolean(suppliedPlain) && timingSafeEqualString(secret, suppliedPlain)
}

async function updateCrmFromJobberEvent(event){
  const topic = String(event.topic || event.event || event.type || '').toLowerCase()
  const payload = event.payload || event.data || event || {}
  const object = payload.object || payload.job || payload.request || payload.quote || payload.client || payload.data || payload
  const jobberId = String(object.id || event.objectId || event.resourceId || payload.id || '')
  if(!jobberId) return { updated:false, reason:'No Jobber object id.' }
  const statusRaw = String(object.status || object.state || payload.status || topic.split('.').pop() || 'Updated')
  const status = statusRaw.replace(/_/g,' ').replace(/\b\w/g, ch=>ch.toUpperCase())
  const crm = await readJsonBlob(CRM_KEY, null)
  if(!crm || !Array.isArray(crm.jobs)) return { updated:false, reason:'CRM jobs not found.' }
  let changed = false
  const jobs = crm.jobs.map(job=>{
    const ids = [job.jobberId, job.jobberJobId, job.externalId, job.jobberObjectId].filter(Boolean).map(String)
    if(ids.includes(jobberId)){
      changed = true
      return { ...job, status, jobberLastEvent:topic || 'jobber.webhook', jobberUpdatedAt:new Date().toISOString() }
    }
    return job
  })
  if(changed){
    const activity = [{ id:`jobber-${Date.now()}`, at:new Date().toISOString(), who:'Jobber Webhook', text:`Updated CRM job from Jobber: ${status}` }, ...(crm.activity||[])].slice(0,1000)
    await writeJsonBlob(CRM_KEY, { ...crm, jobs, activity, savedAt:new Date().toISOString() })
  }
  return { updated:changed }
}

export async function POST(req){
  try{
    const rawBody = await req.text()
    if(!verifyJobberWebhook(req, rawBody)){
      return NextResponse.json(
        { ok:false, error: jobberWebhookSecretConfigured()
          ? 'Invalid Jobber webhook signature.'
          : 'Jobber webhook rejected: JOBBER_WEBHOOK_SECRET is not configured and strict mode is enabled.'
        },
        { status:401 }
      )
    }
    const body = rawBody ? JSON.parse(rawBody) : {}
    const crmUpdate = await updateCrmFromJobberEvent(body).catch(e=>({updated:false,error:e.message}))
    if(crmUpdate.error) return NextResponse.json({ ok:false, error:crmUpdate.error, received:true, verified:true }, { status:500 })
    const existing = await readSecureJson(EVENTS_KEY, [])
    const list = Array.isArray(existing) ? existing : []
    await writeSecureJson(EVENTS_KEY, [safeBody(body), ...list].slice(0,500))
    return NextResponse.json({ ok:true, received:true, crmUpdated:crmUpdate.updated, verified:true })
  }catch(e){
    return NextResponse.json({ ok:false, error:e.message }, { status:500 })
  }
}
