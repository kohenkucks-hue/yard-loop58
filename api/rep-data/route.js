export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../lib/adminAuth'
import { readJsonBlob, writeJsonBlob, hasBlobToken } from '../../lib/blobJson'

const KEY = 'yard-loop-rep-portal.json'

const SECRET_INTEGRATION_KEYS = new Set(['clientId','clientSecret','redirectUrl','authorizationUrl','accessToken','refreshToken','webhookSecret','publishableKey','secretKey','mapsApiKey','analyticsMeasurementId','tagManagerId','oauthClientId','oauthClientSecret','resendApiKey','accountSid','authToken','companyId','priceIdMonthly','driveFolderId'])
function clone(obj){ return JSON.parse(JSON.stringify(obj || {})) }
function sanitizeRepData(raw){
  const safe = clone(raw)
  // V25: strip accidental credential fields at root level
  delete safe.cloudPassword
  delete safe.adminPassword
  const integrations = safe?.settings?.integrations
  if(integrations){
    Object.keys(integrations).forEach(provider=>{
      Object.keys(integrations[provider]||{}).forEach(key=>{
        if(SECRET_INTEGRATION_KEYS.has(key)) delete integrations[provider][key]
      })
    })
  }
  return safe
}

// V25: Starter PINs are blank. Set real PINs in User Management before first cloud save.
const starter = {
  schemaVersion: 'rep-portal-v1',
  savedAt: null,
  users: [
    {id:'kevin', name:'Kevin Kucks', role:'Owner', email:'', phone:'', pin:'', active:true, fullAccess:true},
    {id:'jamie', name:'Jamie Kucks', role:'Owner', email:'', phone:'', pin:'', active:true, fullAccess:true},
    {id:'kohen', name:'Kohen Kucks', role:'Owner', email:'', phone:'', pin:'', active:true, fullAccess:true}
  ],
  customers: [], leads: [], estimates: [], contracts: [], tasks: [], referrals: [], reviews: [], gallery: [], activity: [], settings: {}
}

export async function GET(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  const data = await readJsonBlob(KEY, starter)
  return NextResponse.json(sanitizeRepData(data || starter), { headers: { 'Cache-Control':'no-store, no-cache, must-revalidate' } })
}

export async function POST(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  if(!hasBlobToken()) return NextResponse.json({ error:'Vercel Blob is not connected. Add BLOB_READ_WRITE_TOKEN in Vercel. The Rep Portal will still work locally in the browser during testing.' }, { status:500 })

  // V25: body size limit — 2 MB is generous for full CRM state
  const raw = await req.text().catch(()=>'')
  if(raw.length > 2 * 1024 * 1024) return NextResponse.json({ error:'Rep Portal payload too large (max 2 MB). Export a backup and contact support if data is unexpectedly large.' }, { status:413 })

  let body = {}
  try { body = raw ? JSON.parse(raw) : {} } catch {
    return NextResponse.json({ error:'Invalid Rep Portal payload.' }, { status:400 })
  }

  try{
    const next = sanitizeRepData({ ...starter, ...body, schemaVersion:'rep-portal-v1', savedAt:new Date().toISOString() })
    await writeJsonBlob(KEY, next)
    return NextResponse.json({ ok:true, savedAt: next.savedAt })
  }catch(e){
    return NextResponse.json({ error:'Rep Portal save failed: '+e.message }, { status:500 })
  }
}
