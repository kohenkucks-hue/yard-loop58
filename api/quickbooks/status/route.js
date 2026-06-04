export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { qbConfigured, readQbToken } from '../../../lib/quickbooks'
export async function GET(req){ const denied=requireAdmin(req); if(denied)return denied; const token=await readQbToken().catch(()=>null); return NextResponse.json({ok:true,configured:qbConfigured(),connected:Boolean(token?.access_token),realmId:token?.realmId||process.env.QUICKBOOKS_COMPANY_ID||'',savedAt:token?.savedAt||'',implemented:true,routes:['connect','callback','sync-customer','create-invoice','mark-paid','contractor-expense','refresh-token']},{headers:{'Cache-Control':'no-store'}}) }
