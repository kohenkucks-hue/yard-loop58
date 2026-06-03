export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../lib/adminAuth'
import { hasBlobToken, readJsonBlob, writeJsonBlob } from '../../lib/blobJson'

const LEADS_KEY = 'yard-loop-leads.json'

async function readLeads(){
  const leads = await readJsonBlob(LEADS_KEY, [])
  return Array.isArray(leads) ? leads : []
}

export async function GET(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  if(!hasBlobToken()) return NextResponse.json({ leads:[], note:'Vercel Blob not connected.' })
  const leads = await readLeads()
  return NextResponse.json({ leads })
}

export async function DELETE(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  if(!hasBlobToken()) return NextResponse.json({ error:'Vercel Blob not connected.' },{ status:500 })

  // V25: size limit before parse
  const raw = await req.text().catch(()=>'')
  if(raw.length > 5000) return NextResponse.json({ error:'Request too large.' }, { status:413 })

  let body = {}
  try { body = raw ? JSON.parse(raw) : {} } catch {
    return NextResponse.json({ error:'Invalid payload.' }, { status:400 })
  }

  const { id } = body
  if(!id || typeof id !== 'string') return NextResponse.json({ error:'Missing lead id.' }, { status:400 })

  const leads = await readLeads()
  await writeJsonBlob(LEADS_KEY, leads.filter(l => l.id !== id))
  return NextResponse.json({ ok:true })
}
