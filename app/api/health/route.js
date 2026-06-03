export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { hasBlobToken, readJsonBlob, writeJsonBlob } from '../../lib/blobJson'
import { emailConfigStatus } from '../../lib/leadEmail'
import { requireAdmin } from '../../lib/adminAuth'

export async function GET(req) {
  // V25: use shared requireAdmin() helper for consistency with all other protected routes
  const denied = requireAdmin(req)
  if(denied) return denied

  const blobToken = hasBlobToken()
  let blobRead = false
  let blobWrite = false
  let error = null

  if (blobToken) {
    try {
      const key = 'yard-loop-health.json'
      const data = { ok: true, checkedAt: new Date().toISOString() }
      await writeJsonBlob(key, data)
      blobWrite = true
      const readBack = await readJsonBlob(key, null)
      blobRead = Boolean(readBack?.ok)
    } catch (e) {
      error = e.message
    }
  }

  const emailStatus = emailConfigStatus()

  return NextResponse.json({
    ok: blobToken && blobRead && blobWrite,
    vercelBlobTokenPresent: blobToken,
    blobRead,
    blobWrite,
    error,
    emailNotifications: {
      resendApiKeyPresent: emailStatus.resendApiKeyPresent,
      notifyEmailConfigured: Boolean(emailStatus.notifyEmail),
      fromEmailConfigured: Boolean(emailStatus.fromEmail)
    },
    message: blobToken ? 'Vercel Blob token found.' : 'Missing BLOB_READ_WRITE_TOKEN in Vercel Environment Variables.'
  }, { headers: { 'Cache-Control':'no-store' } })
}
