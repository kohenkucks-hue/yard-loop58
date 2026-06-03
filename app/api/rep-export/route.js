export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { readJsonBlob } from '../../lib/blobJson'
import { requireAdmin } from '../../lib/adminAuth'

const KEY = 'yard-loop-rep-portal.json'
const starter = { users:[], customers:[], leads:[], estimates:[], contracts:[], tasks:[], referrals:[], reviews:[], gallery:[], activity:[] }

function stripSignatureImages(raw){
  const data = JSON.parse(JSON.stringify(raw || starter))
  ;['contracts','estimates'].forEach(collection=>{
    if(Array.isArray(data[collection])){
      data[collection] = data[collection].map(row=>{
        const copy = {...row}
        delete copy.signatureImage
        if(copy.draft) copy.draft = {...copy.draft, signatureImage:''}
        return copy
      })
    }
  })
  return data
}
export async function GET(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  const data = stripSignatureImages(await readJsonBlob(KEY, starter))
  return new NextResponse(JSON.stringify(data || starter, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="yard-loop-rep-portal-export-${new Date().toISOString().slice(0,10)}.json"`,
      'Cache-Control':'no-store'
    }
  })
}
