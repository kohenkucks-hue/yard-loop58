export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { jobberTest } from '../../../lib/jobber'

export async function POST(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  try{
    const result = await jobberTest()
    return NextResponse.json({ ok:true, result }, { headers:{'Cache-Control':'no-store'} })
  }catch(e){
    return NextResponse.json({ ok:false, error:e.message }, { status:500, headers:{'Cache-Control':'no-store'} })
  }
}
