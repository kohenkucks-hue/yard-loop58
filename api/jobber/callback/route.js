export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { exchangeJobberCode, jobberConfigured, validateJobberOAuthState } from '../../../lib/jobber'

export async function GET(req){
  if(!jobberConfigured()) return NextResponse.json({ ok:false, error:'Jobber env vars are not configured.' }, { status:400 })
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  if(error) return NextResponse.json({ ok:false, error }, { status:400 })
  if(!code) return NextResponse.json({ ok:false, error:'Missing Jobber authorization code.' }, { status:400 })
  try{
    const validState = await validateJobberOAuthState(state)
    if(!validState) return NextResponse.json({ ok:false, error:'Invalid or expired Jobber OAuth state. Start the connection again from /admin/jobber.' }, { status:400, headers:{'Cache-Control':'no-store'} })
    await exchangeJobberCode(code)
    return new Response('<h1>Yard Loop Jobber Connected</h1><p>OAuth tokens were saved server-side using Yard Loop secure encrypted storage. You may close this tab and return to the CRM.</p>', { headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'} })
  }catch(e){
    return NextResponse.json({ ok:false, error:e.message }, { status:500, headers:{'Cache-Control':'no-store'} })
  }
}
