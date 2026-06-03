export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../lib/adminAuth'
import { readSecureJson } from '../../lib/secureJson'

const EVENTS_KEY = 'yard-loop-stripe-events.json'

export async function GET(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  const events = await readSecureJson(EVENTS_KEY, [])
  return NextResponse.json({ ok:true, events:Array.isArray(events)?events.slice(0,100):[] }, { headers:{'Cache-Control':'no-store'} })
}
