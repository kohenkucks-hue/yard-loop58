export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { sendLeadEmail, emailConfigStatus } from '../../lib/leadEmail'
import { requireAdmin } from '../../lib/adminAuth'

export async function GET(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  const status = emailConfigStatus()
  const result = await sendLeadEmail({
    source:'Email Test Endpoint',
    status:'Test',
    name:'Yard Loop Email Test',
    phone:'402-235-6168',
    email:'info@yard-loop.com',
    address:'Website test',
    message:'This is a test email from the Yard Loop website email route.'
  })
  return NextResponse.json({ ok: Boolean(result.ok), config: status, result })
}
