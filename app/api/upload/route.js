export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../lib/adminAuth'
import { uploadPublicBlob } from '../../lib/blobJson'


function safeName(name='upload') {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120)
}

export async function POST(req) {
  const denied = requireAdmin(req)
  if(denied) return denied
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!file) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    const allowed = ['image/png','image/jpeg','image/jpg','image/webp','image/svg+xml']
    if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Unsupported image type. Use PNG, JPG/JPEG, WEBP, or SVG.' }, { status: 400 })
    if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Image is too large. Keep photos under 4 MB so Vercel can upload it reliably from the admin page.' }, { status: 400 })
    const blob = await uploadPublicBlob(`yard-loop/uploads/${Date.now()}-${safeName(file.name)}`, file)
    return NextResponse.json({ ok:true, url: blob.url, pathname: blob.pathname, uploadedAt: new Date().toISOString() }, { headers: { 'Cache-Control':'no-store' } })
  } catch(e) {
    return NextResponse.json({ error: 'Upload failed: ' + e.message }, { status: 500 })
  }
}
