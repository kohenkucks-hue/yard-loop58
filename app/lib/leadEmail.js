function escapeHtml(value=''){
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;')
}

function linkValue(label, value){
  const safe = escapeHtml(value)
  if(!value) return ''
  if(label === 'Phone') return `<a href="tel:${safe}" style="color:#2f7d32">${safe}</a>`
  if(label === 'Email') return `<a href="mailto:${safe}" style="color:#2f7d32">${safe}</a>`
  return safe.replaceAll('\n','<br/>')
}

function getResendApiKey(){
  return process.env.RESEND_API_KEY || process.env.RESEND_KEY || process.env.NEXT_RESEND_API_KEY || ''
}

export function emailConfigStatus(){
  const apiKey = getResendApiKey()
  return {
    resendApiKeyPresent: Boolean(apiKey),
    notifyEmail: process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'info@yard-loop.com',
    backupNotifyEmail: process.env.NOTIFY_EMAIL || process.env.LEAD_EMAIL_TO || process.env.ADMIN_EMAIL || '',
    requiredYardLoopInbox: 'info@yard-loop.com',
    // Use RESEND_FROM_EMAIL in Vercel once yard-loop.com is verified in Resend.
    // The onboarding sender is the safest fallback while testing Resend setup.
    fromEmail: process.env.RESEND_FROM_EMAIL || 'Yard Loop Leads <onboarding@resend.dev>',
    replyToFallback: process.env.REPLY_TO_EMAIL || 'info@yard-loop.com'
  }
}

export async function sendLeadEmail(lead={}){
  const apiKey = getResendApiKey()
  const { resendApiKeyPresent, notifyEmail, backupNotifyEmail, requiredYardLoopInbox, fromEmail, replyToFallback } = emailConfigStatus()
  if(!resendApiKeyPresent){
    return { ok:false, skipped:true, code:'MISSING_RESEND_API_KEY', note:'Missing RESEND_API_KEY in Vercel. Lead was accepted/saved, but email was not sent.' }
  }

  const isContractor = lead.leadType === 'contractor' || lead.source === 'Contractor Application' || lead.status === 'New Applicant'
  const subject = isContractor
    ? `New Yard Loop Contractor Application — ${lead.company || lead.name || 'New applicant'}`
    : `New Yard Loop Plan Request — ${lead.name || 'New homeowner'}${lead.phone ? ` (${lead.phone})` : ''}`

  const selectedServices = Array.isArray(lead.selectedServices) ? lead.selectedServices.join(', ') : lead.selectedServices
  const replyTo = lead.email || replyToFallback
  const submittedAt = lead.date || new Date().toISOString()
  const rows = [
    ['Lead Type', isContractor ? 'Contractor Application' : 'Homeowner / Plan Request'],
    lead.source && ['Source', lead.source],
    lead.status && ['Status', lead.status],
    lead.name && ['Name', lead.name],
    lead.company && ['Company', lead.company],
    lead.phone && ['Phone', lead.phone],
    lead.email && ['Email', lead.email],
    (lead.address || lead.serviceArea) && ['Address / Service Area', lead.address || lead.serviceArea],
    lead.city && ['City', lead.city],
    lead.tier && ['Property / Plan', lead.tier],
    lead.propertyStyle && ['Property Style', lead.propertyStyle],
    selectedServices && ['Requested Services', selectedServices],
    lead.monthly && ['Estimated Monthly', `$${Number(lead.monthly).toLocaleString()}`],
    lead.annual && ['Estimated Annual', `$${Number(lead.annual).toLocaleString()}`],
    lead.points && ['Internal Points', lead.points],
    lead.preferredContact && ['Preferred Contact', lead.preferredContact],
    lead.insured && ['Insured', lead.insured],
    lead.licensed && ['Licensed', lead.licensed],
    lead.years && ['Years in Business', lead.years],
    lead.crewSize && ['Crew Size', lead.crewSize],
    lead.availability && ['Availability', lead.availability],
    lead.equipment && ['Equipment Notes', lead.equipment],
    lead.services && ['Contractor Services', Array.isArray(lead.services) ? lead.services.join(', ') : lead.services],
    lead.message && ['Message', lead.message],
    lead.notes && ['Notes', lead.notes],
    submittedAt && ['Submitted', submittedAt]
  ].filter(Boolean)

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,system-ui,sans-serif;background:#f5f9fc;margin:0;padding:22px;color:#071a2f}.card{background:#fff;border-radius:18px;padding:28px;max-width:680px;margin:auto;box-shadow:0 6px 26px rgba(7,26,47,.10)}.badge{display:inline-block;padding:6px 13px;border-radius:999px;background:#e8f5e0;color:#2f7d32;font-weight:800;font-size:13px;margin-bottom:16px}h1{font-size:23px;line-height:1.2;margin:0 0 10px}.intro{color:#51687a;margin:0 0 18px}.row{padding:12px 0;border-bottom:1px solid #edf2f6}.label{display:block;color:#6d8294;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}.val{display:block;color:#071a2f;font-size:15px;font-weight:700;line-height:1.45}.cta{display:inline-block;margin-top:22px;padding:13px 22px;background:#2f7d32;color:white!important;border-radius:999px;text-decoration:none;font-weight:800}.footer{margin-top:24px;font-size:12px;color:#8ba1b3;text-align:center}
</style></head><body><div class="card"><div class="badge">${isContractor ? 'Contractor Lead' : 'Homeowner Lead'}</div><h1>${escapeHtml(subject)}</h1><p class="intro">A new Yard Loop ${isContractor ? 'contractor application' : 'homeowner request'} was submitted from the website.</p>${rows.map(([label,value])=>`<div class="row"><span class="label">${escapeHtml(label)}</span><span class="val">${linkValue(label,value)}</span></div>`).join('')}<a class="cta" href="https://www.yard-loop.com/admin">Open Admin Dashboard</a><div class="footer">Yard Loop · Auto notification · Sent to info@yard-loop.com</div></div></body></html>`

  const text = `${subject}\n\n${rows.map(([label,value])=>`${label}: ${Array.isArray(value) ? value.join(', ') : value}`).join('\n')}\n\nOpen admin: https://www.yard-loop.com/admin`
  const recipients = Array.from(new Set([notifyEmail, requiredYardLoopInbox, backupNotifyEmail].filter(Boolean)))

  let responseText = ''
  let res
  try{
    res = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ Authorization:`Bearer ${apiKey}`, 'Content-Type':'application/json' },
      body:JSON.stringify({ from: fromEmail, to: recipients, reply_to: replyTo, subject, html, text })
    })
    responseText = await res.text().catch(()=>'')
  }catch(e){
    return { ok:false, code:'RESEND_FETCH_FAILED', note:'Could not reach Resend API: '+e.message, to:recipients, from:fromEmail }
  }

  if(!res.ok){
    return { ok:false, code:'RESEND_REJECTED', status:res.status, note:responseText || 'Resend email failed.', to:recipients, from:fromEmail }
  }
  let data = null
  try { data = JSON.parse(responseText) } catch { data = responseText }
  return { ok:true, data, to:recipients, from:fromEmail }
}
