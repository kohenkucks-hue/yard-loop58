export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../lib/adminAuth'
import { revalidatePath } from 'next/cache'
import { defaultContent } from '../../defaultContent'
import { hasBlobToken, readJsonBlob, writePublicJsonBlob } from '../../lib/blobJson'

const KEY = 'yard-loop-cms.json'

export async function GET(){
  const saved = await readJsonBlob(KEY, defaultContent)
  return NextResponse.json(saved || defaultContent, { headers: { 'Cache-Control':'no-store, no-cache, must-revalidate, proxy-revalidate', 'Pragma':'no-cache', 'Expires':'0' } })
}

export async function POST(req){
  const denied = requireAdmin(req)
  if(denied) return denied

  // V25: body size limit — 512 KB is ample for CMS content
  const raw = await req.text().catch(()=>'')
  if(raw.length > 512 * 1024) return NextResponse.json({ error:'CMS content payload too large (max 512 KB).' }, { status:413 })

  let body = {}
  try { body = raw ? JSON.parse(raw) : {} } catch {
    return NextResponse.json({ error:'Invalid CMS payload.' }, { status:400 })
  }

  try {
    if(!hasBlobToken()) return NextResponse.json({ error:'Vercel Blob is not connected. Add BLOB_READ_WRITE_TOKEN in Vercel.' },{ status:500 })
    await writePublicJsonBlob(KEY, body)
    try {
      revalidatePath('/', 'layout')
      revalidatePath('/services')
      revalidatePath('/gallery')
      revalidatePath('/pricing')
      revalidatePath('/how-it-works')
      revalidatePath('/contact')
      revalidatePath('/estimate')
      revalidatePath('/get-my-plan')
      revalidatePath('/contractor')
    } catch {}
    return NextResponse.json({ ok:true, savedAt: new Date().toISOString() }, { headers: { 'Cache-Control':'no-store, no-cache, must-revalidate, proxy-revalidate', 'Pragma':'no-cache', 'Expires':'0' } })
  } catch(e) {
    return NextResponse.json({ error:'Save failed: ' + e.message },{ status:500 })
  }
}
