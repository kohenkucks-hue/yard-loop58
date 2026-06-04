export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { readJsonBlob } from '../../../lib/blobJson'
const CRM_KEY='yard-loop-rep-portal.json'
export async function POST(req){ const {email,pin}=await req.json().catch(()=>({})); const crm=await readJsonBlob(CRM_KEY,{}); const c=(crm.contractors||[]).find(x=>String(x.email||'').toLowerCase()===String(email||'').toLowerCase() && (!x.pin||String(x.pin)===String(pin||''))); if(!c)return NextResponse.json({ok:false,error:'Invalid contractor login'},{status:401}); return NextResponse.json({ok:true,contractor:{id:c.id,name:c.name,email:c.email,service:c.service}}) }
