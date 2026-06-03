export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'

export async function GET(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  return NextResponse.json({ ok:true, configured:Boolean(process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET && process.env.QUICKBOOKS_REDIRECT_URL), implemented:false, note:'QuickBooks env vars are scaffolded. OAuth/sync routes should be built after Jobber and Stripe are stable.' }, { headers:{'Cache-Control':'no-store'} })
}
