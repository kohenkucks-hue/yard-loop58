export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { jobberAuthorizeUrl, jobberConfigured, saveJobberOAuthState } from '../../../lib/jobber'

export async function GET(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  if(!jobberConfigured()) return NextResponse.json({ ok:false, error:'Missing JOBBER_CLIENT_ID, JOBBER_CLIENT_SECRET, or JOBBER_REDIRECT_URL in Vercel.' }, { status:400 })
  try{
    const state = crypto.randomUUID()
    await saveJobberOAuthState(state)
    return NextResponse.json({ ok:true, stateSaved:true, authorizeUrl:jobberAuthorizeUrl(state), note:'Open this URL while logged into Jobber, approve access, then return to the configured callback URL.' }, { headers:{'Cache-Control':'no-store'} })
  }catch(e){
    return NextResponse.json({ ok:false, error:'Could not store Jobber OAuth state. Confirm BLOB_READ_WRITE_TOKEN is configured and redeploy after saving Vercel variables: '+e.message }, { status:500, headers:{'Cache-Control':'no-store'} })
  }
}
