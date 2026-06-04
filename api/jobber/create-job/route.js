export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { jobberGraphql } from '../../../lib/jobber'

const CREATE_JOB_MUTATION = `mutation YardLoopCreateJob($input: JobCreateInput!) { jobCreate(input: $input) { job { id title } userErrors { message path } } }`

function normalizeJob(job={}){
  return {
    title: String(job.service || job.title || 'Yard Loop Service').trim().slice(0, 200),
    customerName: String(job.customerName || job.name || '').trim().slice(0, 200),
    address: String(job.address || job.propertyAddress || '').trim().slice(0, 300),
    notes: String(job.notes || '').trim().slice(0, 1000),
    due: String(job.due || '').trim(),
    jobberClientId: String(job.jobberClientId || job.clientId || '').trim(),
  }
}

// V25: sanitize instructions before sending to Jobber GraphQL
function buildInstructions(parts=[]){
  const joined = parts.filter(Boolean).join('\n')
  // Collapse runs of whitespace/newlines and cap total length
  return joined.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').slice(0, 2000)
}

export async function POST(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  // V28: cap admin job-create payload before JSON parsing.
  const raw = await req.text().catch(()=>'')
  if(raw.length > 25 * 1024) return NextResponse.json({ ok:false, error:'Jobber job payload too large (max 25 KB).' }, { status:413 })
  let job = {}
  try { job = raw ? JSON.parse(raw) : {} } catch {
    return NextResponse.json({ ok:false, error:'Invalid Jobber job payload.' }, { status:400 })
  }
  const j = normalizeJob(job)
  try{
    // First-pass Jobber job/work-order creation. Do not send unverified schedule fields;
    // verify exact scheduling mutation in Jobber GraphiQL before production scheduling sync.
    const instructionParts = [j.customerName, j.address, j.notes]
    if(j.due){
      try { instructionParts.push(`Preferred date: ${new Date(j.due).toISOString()}`) } catch {}
    }
    const input = {
      title: j.title,
      instructions: buildInstructions(instructionParts),
    }
    if(j.jobberClientId) input.clientId = j.jobberClientId

    const result = await jobberGraphql(CREATE_JOB_MUTATION, { input })
    const userErrors = result?.data?.jobCreate?.userErrors || []
    if(userErrors.length) return NextResponse.json({ ok:false, userErrors, result, note:'Jobber jobCreate field mapping may need adjustment for your app/account.' }, { status:400 })
    const jobberJobId = result?.data?.jobCreate?.job?.id || ''
    return NextResponse.json({ ok:true, jobberJobId, result, note:'CRM job was sent to Jobber jobCreate. Verify in Jobber test account before production.' }, { headers:{'Cache-Control':'no-store'} })
  }catch(e){
    return NextResponse.json({ ok:false, error:e.message, note:'Jobber job creation schema/scopes may need adjustment after sandbox testing.' }, { status:500 })
  }
}
