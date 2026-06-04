import { readSecureJson, writeSecureJson } from './secureJson'
const TOKEN_KEY='yard-loop-quickbooks-oauth.json'
export function qbEnv(){return {clientId:process.env.QUICKBOOKS_CLIENT_ID||'',clientSecret:process.env.QUICKBOOKS_CLIENT_SECRET||'',redirectUrl:process.env.QUICKBOOKS_REDIRECT_URL||'',companyId:process.env.QUICKBOOKS_COMPANY_ID||'',baseUrl:(process.env.QUICKBOOKS_BASE_URL||'https://quickbooks.api.intuit.com').replace(/\/$/,'')}}
export function qbConfigured(){const e=qbEnv(); return Boolean(e.clientId&&e.clientSecret&&e.redirectUrl)}
export function qbAuthorizeUrl(state='yard-loop'){
  const e=qbEnv(); if(!qbConfigured()) throw new Error('Missing QuickBooks OAuth env vars.')
  const u=new URL('https://appcenter.intuit.com/connect/oauth2')
  u.searchParams.set('client_id',e.clientId); u.searchParams.set('redirect_uri',e.redirectUrl); u.searchParams.set('response_type','code'); u.searchParams.set('scope','com.intuit.quickbooks.accounting'); u.searchParams.set('state',state)
  return u.toString()
}
export async function exchangeQbCode(code,realmId=''){
  const e=qbEnv(); const auth=Buffer.from(`${e.clientId}:${e.clientSecret}`).toString('base64')
  const r=await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body:new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:e.redirectUrl})})
  const j=await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.error_description||j.error||'QuickBooks token exchange failed')
  const token={...j,realmId:realmId||e.companyId,createdAt:Date.now(),savedAt:new Date().toISOString()}; await writeSecureJson(TOKEN_KEY,token); return token
}
export async function readQbToken(){return readSecureJson(TOKEN_KEY,null)}
export async function saveQbToken(t){return writeSecureJson(TOKEN_KEY,t)}
export async function refreshQbToken(token){
  const e=qbEnv(); if(!token?.refresh_token) throw new Error('QuickBooks refresh token missing. Reconnect QuickBooks.')
  const auth=Buffer.from(`${e.clientId}:${e.clientSecret}`).toString('base64')
  const r=await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:token.refresh_token})})
  const j=await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.error_description||j.error||'QuickBooks token refresh failed')
  const next={...token,...j,refresh_token:j.refresh_token||token.refresh_token,createdAt:Date.now(),savedAt:new Date().toISOString()}; await saveQbToken(next); return next
}
export async function qbAccessToken(){
  let t=await readQbToken(); if(!t?.access_token) throw new Error('QuickBooks is not connected.')
  const expiresAt=Number(t.createdAt||0)+Number(t.expires_in||0)*1000-120000
  if(Date.now()>expiresAt) t=await refreshQbToken(t)
  return t.access_token
}
export async function qbRequest(path,{method='GET',body}={}){
  const e=qbEnv(); const t=await readQbToken(); const realm=t?.realmId||e.companyId; if(!realm) throw new Error('Missing QUICKBOOKS_COMPANY_ID / realmId')
  const access=await qbAccessToken(); const sep=path.includes('?')?'&':'?'
  const url=`${e.baseUrl}/v3/company/${realm}${path}${sep}minorversion=75`
  const r=await fetch(url,{method,headers:{Authorization:`Bearer ${access}`,Accept:'application/json','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store'})
  const j=await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.Fault?.Error?.[0]?.Message||j.error||`QuickBooks failed ${r.status}`)
  return j
}
export function customerToQb(c={}){return {DisplayName:c.name||c.customerName||c.email||c.id,PrimaryEmailAddr:c.email?{Address:c.email}:undefined,PrimaryPhone:c.phone?{FreeFormNumber:c.phone}:undefined,BillAddr:{Line1:c.address||'',City:c.city||'',CountrySubDivisionCode:c.state||'',PostalCode:c.zip||''},Notes:`Yard Loop customer ${c.id||''}`}}
