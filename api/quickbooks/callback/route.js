export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { exchangeQbCode } from '../../../lib/quickbooks'
export async function GET(req){ try{const u=new URL(req.url); const code=u.searchParams.get('code'); const realmId=u.searchParams.get('realmId')||u.searchParams.get('realmID')||''; if(!code) throw new Error('Missing QuickBooks code'); await exchangeQbCode(code,realmId); return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL||'https://www.yard-loop.com'}/rep?quickbooks=connected`)}catch(e){return NextResponse.json({ok:false,error:e.message},{status:400})} }
