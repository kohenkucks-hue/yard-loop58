import crypto from 'crypto'

// V28 Jobber/Blob fix:
// This project is using a Vercel Blob store that accepts public writes, not private writes.
// Sensitive JSON written through this helper is encrypted before storage, then saved as a public blob.
// Reads remain backward-compatible with older plain JSON blobs.
const SECURE_OPTIONS = {
  access: 'public',
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: 'application/json; charset=utf-8',
  cacheControlMaxAge: 0,
}

const ENCRYPTION_VERSION = 'yard-loop-secure-json-v1'

function encryptionSecret(){
  return process.env.SECURE_JSON_SECRET || process.env.JOBBER_TOKEN_ENCRYPTION_KEY || process.env.JOBBER_CLIENT_SECRET || process.env.STRIPE_SECRET_KEY || ''
}

function keyFromSecret(secret){
  return crypto.createHash('sha256').update(String(secret)).digest()
}

function encryptJson(data){
  const secret = encryptionSecret()
  if(!secret) return data
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', keyFromSecret(secret), iv)
  const plaintext = Buffer.from(JSON.stringify(data), 'utf8')
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    __secure: ENCRYPTION_VERSION,
    alg: 'AES-256-GCM',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
    savedAt: new Date().toISOString(),
  }
}

function decryptJson(payload){
  if(!payload || payload.__secure !== ENCRYPTION_VERSION) return payload
  const secret = encryptionSecret()
  if(!secret) throw new Error('Secure JSON is encrypted but no SECURE_JSON_SECRET, JOBBER_TOKEN_ENCRYPTION_KEY, JOBBER_CLIENT_SECRET, or STRIPE_SECRET_KEY is configured.')
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyFromSecret(secret), Buffer.from(payload.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(payload.data, 'base64')), decipher.final()])
  return JSON.parse(decrypted.toString('utf8'))
}

export function secureBlobReady(){
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export async function readSecureJson(key, fallback){
  if(!secureBlobReady()) return fallback
  try{
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ prefix:key, token:process.env.BLOB_READ_WRITE_TOKEN })
    const exact = blobs?.find(b=>b.pathname===key) || blobs?.[0]
    if(!exact?.url) return fallback
    const blobUrl = exact.downloadUrl || exact.url
    const sep = blobUrl.includes('?') ? '&' : '?'
    const res = await fetch(`${blobUrl}${sep}v=${Date.now()}`, { cache:'no-store', next:{ revalidate:0 } })
    if(!res.ok) return fallback
    const json = await res.json()
    return decryptJson(json)
  }catch(e){
    console.error(`Secure blob read failed for ${key}:`, e)
    return fallback
  }
}

export async function writeSecureJson(key, data){
  if(!secureBlobReady()) throw new Error('Missing BLOB_READ_WRITE_TOKEN.')
  const { put } = await import('@vercel/blob')
  const payload = encryptJson(data)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' })
  return put(key, blob, { ...SECURE_OPTIONS, token:process.env.BLOB_READ_WRITE_TOKEN })
}
