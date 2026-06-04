export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { readQbToken, refreshQbToken } from '../../../lib/quickbooks'
export async function POST(req){ const denied=requireAdmin(req); if(denied)return denied; try{const t=await readQbToken(); if(!t) return NextResponse.json({ok:false,connected:false,error:'QuickBooks not connected'}); const next=await refreshQbToken(t); return NextResponse.json({ok:true,connected:true,savedAt:next.savedAt})}catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})} }
