export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'

function twilioConfigured(){ return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) }

// E.164 format: +15551234567 (7–15 digits after +)
function isValidPhone(to=''){
  return /^\+[1-9]\d{6,14}$/.test(String(to).trim())
}

export async function POST(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  if(!twilioConfigured()) return NextResponse.json({ ok:false, error:'Missing Twilio env vars.' }, { status:400 })

  // V28: read text first so large SMS payloads are rejected before JSON parsing.
  const raw = await req.text().catch(()=>'')
  if(raw.length > 10 * 1024) return NextResponse.json({ ok:false, error:'SMS request too large (max 10 KB).' }, { status:413 })
  let body = {}
  try { body = raw ? JSON.parse(raw) : {} } catch {
    return NextResponse.json({ ok:false, error:'Invalid SMS payload.' }, { status:400 })
  }
  if(!body.consentConfirmed) return NextResponse.json({ ok:false, error:'SMS consent is required before sending Yard Loop texts.' }, { status:400 })
  if(!body.to || !body.message) return NextResponse.json({ ok:false, error:'Missing to or message.' }, { status:400 })

  // V25: phone format validation
  const to = String(body.to).trim()
  if(!isValidPhone(to)) return NextResponse.json({ ok:false, error:'Phone number must be in E.164 format (e.g. +15551234567).' }, { status:400 })

  // V25: message length cap (1,600 chars = ~10 SMS segments)
  const message = String(body.message).slice(0, 1600)

  try{
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const auth = Buffer.from(`${sid}:${token}`).toString('base64')
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method:'POST',
      headers:{ 'Authorization':`Basic ${auth}`, 'Content-Type':'application/x-www-form-urlencoded' },
      body:new URLSearchParams({ From:process.env.TWILIO_FROM_NUMBER, To:to, Body:message }),
      cache:'no-store'
    })
    const json = await res.json().catch(()=>({}))
    if(!res.ok) throw new Error(json.message || `Twilio send failed (${res.status})`)
    return NextResponse.json({ ok:true, sid:json.sid, status:json.status }, { headers:{'Cache-Control':'no-store'} })
  }catch(e){
    return NextResponse.json({ ok:false, error:e.message }, { status:500, headers:{'Cache-Control':'no-store'} })
  }
}
