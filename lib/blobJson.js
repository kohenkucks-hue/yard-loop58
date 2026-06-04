const JSON_OPTIONS = {
  access: 'public',
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: 'application/json; charset=utf-8',
  cacheControlMaxAge: 0,
}

export function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export async function readJsonBlob(key, fallback) {
  if (!hasBlobToken()) return fallback
  try {
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ prefix: key, token: process.env.BLOB_READ_WRITE_TOKEN })
    const exact = blobs?.find((b) => b.pathname === key) || blobs?.[0]
    if (!exact?.url) return fallback

    const blobUrl = exact.downloadUrl || exact.url
    const separator = blobUrl.includes('?') ? '&' : '?'
    const res = await fetch(`${blobUrl}${separator}v=${Date.now()}`, { cache: 'no-store', next: { revalidate: 0 } })
    if (!res.ok) return fallback
    return await res.json()
  } catch (error) {
    console.error(`Blob read failed for ${key}:`, error)
    return fallback
  }
}

export async function writeJsonBlob(key, data) {
  if (!hasBlobToken()) throw new Error('Vercel Blob is not connected. Missing BLOB_READ_WRITE_TOKEN.')
  const { put } = await import('@vercel/blob')
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  return put(key, blob, { ...JSON_OPTIONS, token: process.env.BLOB_READ_WRITE_TOKEN })
}

export async function uploadPublicBlob(path, file) {
  if (!hasBlobToken()) throw new Error('Vercel Blob is not connected. Missing BLOB_READ_WRITE_TOKEN.')
  const { put } = await import('@vercel/blob')
  return put(path, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: true,
    cacheControlMaxAge: 60,
    contentType: file?.type || 'application/octet-stream',
  })
}

// CMS website content is intentionally public-facing: logos, text, colors, social links, and public page settings.
// This V28 runtime patch uses public JSON writes because the active Vercel Blob store does not support private writes.
// Sensitive Jobber/Stripe event/token data goes through secureJson.js, which encrypts before storing.
export async function writePublicJsonBlob(key, data) {
  if (!hasBlobToken()) throw new Error('Vercel Blob is not connected. Missing BLOB_READ_WRITE_TOKEN.')
  const { put } = await import('@vercel/blob')
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  return put(key, blob, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
    cacheControlMaxAge: 0,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
}
