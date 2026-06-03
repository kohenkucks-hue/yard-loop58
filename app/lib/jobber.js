import { readSecureJson, writeSecureJson } from './secureJson'

const TOKEN_KEY = 'yard-loop-jobber-tokens.json'
const OAUTH_STATE_KEY = 'yard-loop-jobber-oauth-state.json'
const JOBBER_AUTH_URL = 'https://api.getjobber.com/api/oauth/authorize'
const JOBBER_TOKEN_URL = 'https://api.getjobber.com/api/oauth/token'
const JOBBER_GRAPHQL_URL = 'https://api.getjobber.com/api/graphql'

export function jobberConfig(){
  return {
    clientId: process.env.JOBBER_CLIENT_ID || '',
    clientSecret: process.env.JOBBER_CLIENT_SECRET || '',
    redirectUrl: process.env.JOBBER_REDIRECT_URL || '',
  }
}

export function jobberConfigured(){
  const c = jobberConfig()
  return Boolean(c.clientId && c.clientSecret && c.redirectUrl)
}

export function jobberAuthorizeUrl(state='yard-loop'){
  const c = jobberConfig()
  const params = new URLSearchParams({
    response_type:'code',
    client_id:c.clientId,
    redirect_uri:c.redirectUrl,
    state,
  })
  return `${JOBBER_AUTH_URL}?${params.toString()}`
}


export async function saveJobberOAuthState(state){
  const value = String(state || '')
  if(!value) throw new Error('Missing OAuth state.')
  await writeSecureJson(OAUTH_STATE_KEY, { value, createdAt:new Date().toISOString(), expiresAt:Date.now()+10*60*1000 })
  return value
}

export async function validateJobberOAuthState(state){
  const supplied = String(state || '')
  const stored = await readSecureJson(OAUTH_STATE_KEY, null)
  if(!supplied || !stored?.value || supplied !== stored.value) return false
  if(stored.expiresAt && Date.now() > Number(stored.expiresAt)) return false
  await writeSecureJson(OAUTH_STATE_KEY, { value:'used', usedAt:new Date().toISOString(), expiresAt:Date.now()-1 })
  return true
}

export async function readJobberTokens(){
  const fromEnv = {
    access_token: process.env.JOBBER_ACCESS_TOKEN || '',
    refresh_token: process.env.JOBBER_REFRESH_TOKEN || '',
    token_type:'Bearer',
  }
  const stored = await readSecureJson(TOKEN_KEY, {})
  return { ...fromEnv, ...stored }
}

export async function saveJobberTokens(tokens){
  const safe = {
    access_token: tokens.access_token || tokens.accessToken || '',
    refresh_token: tokens.refresh_token || tokens.refreshToken || '',
    token_type: tokens.token_type || 'Bearer',
    expires_in: tokens.expires_in || null,
    savedAt: new Date().toISOString(),
  }
  await writeSecureJson(TOKEN_KEY, safe)
  return safe
}

export async function exchangeJobberCode(code){
  const c = jobberConfig()
  const res = await fetch(JOBBER_TOKEN_URL, {
    method:'POST',
    headers:{ 'Content-Type':'application/x-www-form-urlencoded', 'Accept':'application/json' },
    body:new URLSearchParams({
      grant_type:'authorization_code',
      code,
      client_id:c.clientId,
      client_secret:c.clientSecret,
      redirect_uri:c.redirectUrl,
    }),
    cache:'no-store'
  })
  const json = await res.json().catch(()=>({}))
  if(!res.ok) throw new Error(json.error_description || json.error || `Jobber token exchange failed (${res.status})`)
  return saveJobberTokens(json)
}

export async function refreshJobberToken(refreshToken){
  const c = jobberConfig()
  const res = await fetch(JOBBER_TOKEN_URL, {
    method:'POST',
    headers:{ 'Content-Type':'application/x-www-form-urlencoded', 'Accept':'application/json' },
    body:new URLSearchParams({
      grant_type:'refresh_token',
      refresh_token:refreshToken,
      client_id:c.clientId,
      client_secret:c.clientSecret,
    }),
    cache:'no-store'
  })
  const json = await res.json().catch(()=>({}))
  if(!res.ok) throw new Error(json.error_description || json.error || `Jobber token refresh failed (${res.status})`)
  return saveJobberTokens(json)
}

export async function jobberGraphql(query, variables={}){
  let tokens = await readJobberTokens()
  if(!tokens.access_token && tokens.refresh_token) tokens = await refreshJobberToken(tokens.refresh_token)
  if(!tokens.access_token) throw new Error('Jobber is not connected. Complete OAuth first or add test tokens in Vercel.')
  let res = await fetch(JOBBER_GRAPHQL_URL, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${tokens.access_token}`, 'Accept':'application/json' },
    body:JSON.stringify({ query, variables }),
    cache:'no-store'
  })
  if(res.status === 401 && tokens.refresh_token){
    tokens = await refreshJobberToken(tokens.refresh_token)
    res = await fetch(JOBBER_GRAPHQL_URL, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${tokens.access_token}`, 'Accept':'application/json' },
      body:JSON.stringify({ query, variables }),
      cache:'no-store'
    })
  }
  const json = await res.json().catch(()=>({}))
  if(!res.ok || json.errors) throw new Error(json.errors?.[0]?.message || json.error || `Jobber GraphQL failed (${res.status})`)
  return json
}

export async function jobberTest(){
  return jobberGraphql(`query YardLoopViewerTest { account { id name } }`)
}

// V25: Exported for use in webhook route — warns when secret is missing in non-strict mode
export function jobberWebhookSecretConfigured(){
  return Boolean(process.env.JOBBER_WEBHOOK_SECRET)
}

// V25: Set JOBBER_WEBHOOK_VERIFIED_MODE=strict in Vercel to reject webhook calls
// when JOBBER_WEBHOOK_SECRET is not configured (recommended for production).
export function jobberWebhookStrictMode(){
  return process.env.JOBBER_WEBHOOK_VERIFIED_MODE === 'strict'
}
