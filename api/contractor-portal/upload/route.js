export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { readJsonBlob } from '../../../lib/blobJson'
import { uploadPublicBlob } from '../../../lib/blobJson'
const CRM_KEY='yard-loop-rep-portal.json'
function safeName(name='upload') { return String(name).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120) }
export async function POST(req){
  try{
    const form=await req.formData()
    const contractorId=String(form.get('contractorId')||'')
    const contractorName=String(form.get('contractorName')||'')
    const jobId=String(form.get('jobId')||'')
    const file=form.get('file')
    if(!contractorId||!jobId) return NextResponse.json({ok:false,error:'Missing contractor or job.'},{status:400})
    const crm=await readJsonBlob(CRM_KEY,{})
    const job=(crm.jobs||[]).find(j=>j.id===jobId&&((contractorId&&(j.contractorId===contractorId||j.contractor===contractorId||j.contractorName===contractorId))||(contractorName&&(j.contractor===contractorName||j.contractorName===contractorName))))
    if(!job) return NextResponse.json({ok:false,error:'Job not found for this contractor.'},{status:404})
    if(!file) return NextResponse.json({ok:false,error:'No file uploaded.'},{status:400})
    const allowed=['image/png','image/jpeg','image/jpg','image/webp']
    if(!allowed.includes(file.type)) return NextResponse.json({ok:false,error:'Use PNG, JPG, JPEG, or WEBP.'},{status:400})
    if(file.size>4*1024*1024) return NextResponse.json({ok:false,error:'Photo too large. Keep under 4 MB.'},{status:400})
    const blob=await uploadPublicBlob(`yard-loop/contractor-jobs/${jobId}/${Date.now()}-${safeName(file.name)}`,file)
    return NextResponse.json({ok:true,url:blob.url,pathname:blob.pathname,uploadedAt:new Date().toISOString()})
  }catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})}
}
