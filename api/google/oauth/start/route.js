export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/adminAuth'
import { googleAuthorizeUrl } from '../../../../lib/google'
export async function GET(req){
  const denied=requireAdmin(req); if(denied) return denied
  try{return NextResponse.json({ok:true,authorizeUrl:googleAuthorizeUrl('yard-loop-crm')},{headers:{'Cache-Control':'no-store'}})}catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})}
}
