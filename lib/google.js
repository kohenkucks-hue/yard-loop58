import { readSecureJson, writeSecureJson } from './secureJson'

const TOKEN_KEY = 'yard-loop-google-oauth.json'
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
]

export function googleEnv(){
  return {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URL || '',
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
    mapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    serverMapsKey: process.env.GOOGLE_MAPS_SERVER_KEY || '',
    ga4: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
    gtm: process.env.NEXT_PUBLIC_GTM_ID || ''
  }
}
export function googleConfigured(){
  const e=googleEnv()
  return Boolean(e.clientId && e.clientSecret && e.redirectUri)
}
export function googleAuthorizeUrl(state='yard-loop'){
  const e=googleEnv()
  if(!googleConfigured()) throw new Error('Missing Google OAuth env vars: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI.')
  const u=new URL('https://accounts.google.com/o/oauth2/v2/auth')
  u.searchParams.set('client_id',e.clientId)
  u.searchParams.set('redirect_uri',e.redirectUri)
  u.searchParams.set('response_type','code')
  u.searchParams.set('access_type','offline')
  u.searchParams.set('prompt','consent')
  u.searchParams.set('scope',SCOPES.join(' '))
  u.searchParams.set('state',state)
  return u.toString()
}
export async function exchangeGoogleCode(code){
  const e=googleEnv()
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:e.clientId,client_secret:e.clientSecret,redirect_uri:e.redirectUri,grant_type:'authorization_code'})})
  const j=await r.json().catch(()=>({}))
  if(!r.ok) throw new Error(j.error_description||j.error||'Google token exchange failed')
  const token={...j,createdAt:Date.now(),savedAt:new Date().toISOString()}
  await writeSecureJson(TOKEN_KEY,token)
  return token
}
export async function readGoogleToken(){
  return readSecureJson(TOKEN_KEY,null)
}
async function refreshGoogleToken(token){
  const e=googleEnv()
  if(!token?.refresh_token) throw new Error('Google OAuth refresh token missing. Reconnect Google from CRM Integrations.')
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:e.clientId,client_secret:e.clientSecret,refresh_token:token.refresh_token,grant_type:'refresh_token'})})
  const j=await r.json().catch(()=>({}))
  if(!r.ok) throw new Error(j.error_description||j.error||'Google token refresh failed')
  const next={...token,...j,refresh_token:token.refresh_token,createdAt:Date.now(),savedAt:new Date().toISOString()}
  await writeSecureJson(TOKEN_KEY,next)
  return next
}
export async function googleAccessToken(){
  let token=await readGoogleToken()
  if(!token?.access_token) throw new Error('Google OAuth is not connected. Use CRM → Integrations → Google → Connect Google OAuth.')
  const expiresAt=Number(token.createdAt||0)+Number(token.expires_in||0)*1000-60000
  if(Date.now()>expiresAt) token=await refreshGoogleToken(token)
  return token.access_token
}
export async function googleApi(path,opts={}){
  const access=await googleAccessToken()
  const r=await fetch(path,{...opts,headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json',...(opts.headers||{})}})
  const j=await r.json().catch(()=>({}))
  if(!r.ok) throw new Error(j.error?.message||j.error_description||j.error||`Google API failed: ${r.status}`)
  return j
}
