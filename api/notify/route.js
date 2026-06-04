export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { sendLeadEmail, emailConfigStatus } from '../../lib/leadEmail'
import { requireAdmin } from '../../lib/adminAuth'

export async function GET(){
  const status = emailConfigStatus()
  return NextResponse.json({
    ok: status.resendApiKeyPresent,
    resendApiKeyPresent: status.resendApiKeyPresent,
    notifyEmail: status.notifyEmail,
    fromEmail: status.fromEmail,
    message: status.resendApiKeyPresent
      ? 'Resend API key is present. Submit a test lead from the website to confirm delivery.'
      : 'Missing RESEND_API_KEY in Vercel Environment Variables.'
  })
}

export async function POST(req){
  const auth = requireAdmin(req)
  if(auth) return auth
  try{
    const raw = await req.text()
    if(raw.length > 50_000) return NextResponse.json({ ok:false, error:'Request body too large. Limit is 50 KB.' }, { status:413, headers:{'Cache-Control':'no-store'} })
    const lead = raw ? JSON.parse(raw) : {}
    const result = await sendLeadEmail(lead)
    return NextResponse.json(result.ok ? { ok:true, email:result } : { ok:false, email:result }, { status: result.ok ? 200 : 500 })
  }catch(e){
    const status = e instanceof SyntaxError ? 400 : 500
    return NextResponse.json({ ok:false, note:'Notification error: '+e.message }, { status })
  }
}
