export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { readJsonBlob, writeJsonBlob } from '../../../lib/blobJson'
const CRM_KEY='yard-loop-rep-portal.json'
function matches(job={}, id='', name=''){return (id&&(job.contractorId===id||job.contractor===id||job.contractorName===id)) || (name&&(job.contractor===name||job.contractorName===name))}
export async function GET(req){ const u=new URL(req.url); const id=u.searchParams.get('contractorId')||''; const name=u.searchParams.get('contractorName')||''; const crm=await readJsonBlob(CRM_KEY,{}); const jobs=(crm.jobs||[]).filter(j=>matches(j,id,name)); return NextResponse.json({ok:true,jobs}) }
export async function POST(req){ const p=await req.json(); const crm=await readJsonBlob(CRM_KEY,{}); let changed=false; const jobs=(crm.jobs||[]).map(j=>{if(j.id===p.jobId&&matches(j,p.contractorId||'',p.contractorName||'')){changed=true; return {...j,status:p.status||j.status,afterPhoto:p.afterPhoto||j.afterPhoto,afterPhotos:p.afterPhoto?[...(j.afterPhotos||[]),p.afterPhoto]:(j.afterPhotos||[]),contractorNotes:p.notes||j.contractorNotes,completedAt:p.status==='Completed'?(new Date().toISOString()):j.completedAt,updatedAt:new Date().toISOString()}} return j}); if(changed) await writeJsonBlob(CRM_KEY,{...crm,jobs,savedAt:new Date().toISOString()}); return NextResponse.json({ok:changed,error:changed?undefined:'Job not found for this contractor.'}) }
