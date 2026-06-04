export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { exchangeGoogleCode } from '../../../lib/google'
export async function GET(req){
  const url=new URL(req.url)
  const code=url.searchParams.get('code')
  if(!code) return new Response('Google OAuth failed: missing code.',{status:400})
  try{await exchangeGoogleCode(code);return new Response('<html><body style="font-family:Arial;padding:30px"><h1>Google connected</h1><p>You can close this tab and return to Yard Loop CRM.</p></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'}})}catch(e){return new Response(`<html><body style="font-family:Arial;padding:30px"><h1>Google connection failed</h1><p>${e.message}</p></body></html>`,{status:500,headers:{'Content-Type':'text/html; charset=utf-8'}})}
}
