export function commsEnv(){
  return {
    resendKey: process.env.RESEND_API_KEY || '',
    from: process.env.RESEND_FROM_EMAIL || 'Yard Loop <onboarding@resend.dev>',
    replyTo: process.env.REPLY_TO_EMAIL || process.env.NOTIFY_EMAIL || 'info@yard-loop.com',
    notifyEmail: process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || '',
    twilioSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioFrom: process.env.TWILIO_FROM_NUMBER || ''
  }
}
export function emailConfigured(){ const e=commsEnv(); return Boolean(e.resendKey && e.from) }
export function smsConfigured(){ const e=commsEnv(); return Boolean(e.twilioSid && e.twilioToken && e.twilioFrom) }
export function esc(v=''){ return String(v||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;') }
export async function sendEmail({to,subject,html,text,bcc=[]}){
  const e=commsEnv()
  if(!emailConfigured()) return {ok:false, skipped:true, error:'Missing RESEND_API_KEY / RESEND_FROM_EMAIL'}
  if(!to) return {ok:false, skipped:true, error:'Missing email recipient'}
  const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${e.resendKey}`,'Content-Type':'application/json'},body:JSON.stringify({from:e.from,to:Array.isArray(to)?to:[to],bcc:[...new Set([...(Array.isArray(bcc)?bcc:[bcc]).filter(Boolean), e.notifyEmail].filter(Boolean))],reply_to:e.replyTo,subject,html,text})})
  const body=await res.text().catch(()=>'')
  if(!res.ok) return {ok:false,error:body||`Resend failed ${res.status}`}
  return {ok:true,response:body}
}
export function validPhone(v=''){ return /^\+[1-9]\d{6,14}$/.test(String(v||'').trim()) }
export async function sendSms({to,message,consentConfirmed=true}){
  const e=commsEnv()
  if(!smsConfigured()) return {ok:false, skipped:true, error:'Missing Twilio env vars'}
  if(!consentConfirmed) return {ok:false,error:'SMS consent required'}
  if(!validPhone(to)) return {ok:false,error:'Phone must be E.164 format like +14025551234'}
  const auth=Buffer.from(`${e.twilioSid}:${e.twilioToken}`).toString('base64')
  const res=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${e.twilioSid}/Messages.json`,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({From:e.twilioFrom,To:String(to).trim(),Body:String(message||'').slice(0,1600)})})
  const json=await res.json().catch(()=>({}))
  if(!res.ok) return {ok:false,error:json.message||`Twilio failed ${res.status}`}
  return {ok:true,sid:json.sid,status:json.status}
}
export async function sendEmailSms({email,phone,subject,html,text,sms,consentConfirmed=true}){
  const results={email:null,sms:null}
  if(email) results.email=await sendEmail({to:email,subject,html,text})
  if(phone && sms) results.sms=await sendSms({to:phone,message:sms,consentConfirmed})
  return {ok:Boolean(results.email?.ok || results.sms?.ok), results}
}
