export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { sendEmail, esc } from '../../../lib/communications'
function money(n){return `$${Math.round(Number(n||0)).toLocaleString()}`}
export async function POST(req){ const denied=requireAdmin(req); if(denied)return denied; try{const {customer={},chargeDate='the next billing date'}=await req.json(); const html=`<p>Hi ${esc(customer.name||'there')},</p><p>Your Yard Loop plan of <b>${money(customer.monthly)}</b> is scheduled to charge on <b>${esc(chargeDate)}</b>.</p><p>Questions? Reply to this email.</p>`; const result=await sendEmail({to:customer.email,subject:`Yard Loop billing notice — ${money(customer.monthly)}`,html}); return NextResponse.json({ok:result.ok,result})}catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})} }
