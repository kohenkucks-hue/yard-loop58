export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../lib/adminAuth'
import { hasBlobToken, readJsonBlob, writeJsonBlob } from '../../lib/blobJson'

const LEADS_KEY = 'yard-loop-leads.json'

// Fields that must never be overwritten via patch
const IMMUTABLE_FIELDS = new Set(['id', 'date', 'createdAt'])

async function readLeads(){
  const leads = await readJsonBlob(LEADS_KEY, [])
  return Array.isArray(leads) ? leads : []
}

export async function POST(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  if(!hasBlobToken()) return NextResponse.json({ error:'Vercel Blob not connected.' },{ status:500 })

  // V25: size limit before parse (same pattern as /api/lead)
  const raw = await req.text().catch(()=>'')
  if(raw.length > 25000) return NextResponse.json({ error:'Request too large.' }, { status:413 })

  let body = {}
  try { body = raw ? JSON.parse(raw) : {} } catch {
    return NextResponse.json({ error:'Invalid payload.' }, { status:400 })
  }

  const { id, patch } = body
  if(!id || typeof id !== 'string') return NextResponse.json({ error:'Missing lead id.' }, { status:400 })
  if(!patch || typeof patch !== 'object' || Array.isArray(patch)) return NextResponse.json({ error:'patch must be an object.' }, { status:400 })

  // V25: prevent overwriting immutable fields via patch
  const safePatch = Object.fromEntries(
    Object.entries(patch).filter(([k]) => !IMMUTABLE_FIELDS.has(k))
  )

  const leads = await readLeads()
  const updated = leads.map(l => l.id===id ? {...l,...safePatch} : l)
  await writeJsonBlob(LEADS_KEY, updated)
  return NextResponse.json({ ok:true })
}
