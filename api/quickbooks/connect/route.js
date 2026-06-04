export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { qbAuthorizeUrl } from '../../../lib/quickbooks'
export async function GET(req){ const denied=requireAdmin(req); if(denied) return denied; try{return NextResponse.redirect(qbAuthorizeUrl('yard-loop-qb'))}catch(e){return NextResponse.json({ok:false,error:e.message},{status:400})} }
