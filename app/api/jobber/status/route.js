export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { jobberConfigured, readJobberTokens } from '../../../lib/jobber'

export async function GET(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  const tokens = await readJobberTokens()
  return NextResponse.json({ ok:true, configured:jobberConfigured(), connected:Boolean(tokens.access_token || tokens.refresh_token), tokenValuesHidden:true }, { headers:{'Cache-Control':'no-store'} })
}
