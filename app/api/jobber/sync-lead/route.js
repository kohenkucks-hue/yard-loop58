export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { jobberGraphql } from '../../../lib/jobber'

const CREATE_CLIENT_MUTATION = `mutation YardLoopCreateClient($input: ClientCreateInput!) { clientCreate(input: $input) { client { id name } userErrors { message path } } }`

function normalizeLead(lead={}){
  const name = String(lead.name || lead.clientName || 'Yard Loop Lead').trim()
  const email = String(lead.email || '').trim()
  const phone = String(lead.phone || '').trim()
  const address = String(lead.address || lead.propertyAddress || '').trim()
  const note = String(lead.message || lead.notes || 'Created from Yard Loop website lead.').trim()
  return { name, email, phone, address, note }
}

export async function POST(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  let lead = {}
  try{
    const raw = await req.text()
    if(raw.length > 25_000) return NextResponse.json({ ok:false, error:'Request body too large. Limit is 25 KB.' }, { status:413, headers:{'Cache-Control':'no-store'} })
    lead = raw ? JSON.parse(raw) : {}
  }catch(e){
    return NextResponse.json({ ok:false, error:'Invalid JSON body.' }, { status:400, headers:{'Cache-Control':'no-store'} })
  }
  const l = normalizeLead(lead)
  try{
    // Jobber account schemas can vary by app permission. This route is a safe first-pass client sync target.
    const input = {
      name:l.name,
      emails:l.email ? [{ address:l.email, description:'MAIN' }] : [],
      phones:l.phone ? [{ number:l.phone, description:'MAIN' }] : [],
      properties:l.address ? [{ address1:l.address }] : [],
    }
    const result = await jobberGraphql(CREATE_CLIENT_MUTATION, { input })
    const userErrors = result?.data?.clientCreate?.userErrors || []
    if(userErrors.length) return NextResponse.json({ ok:false, userErrors, result }, { status:400 })
    return NextResponse.json({ ok:true, result, note:'Lead was sent to Jobber clientCreate. Verify field mapping in a Jobber test account before production.' }, { headers:{'Cache-Control':'no-store'} })
  }catch(e){
    return NextResponse.json({ ok:false, error:e.message, note:'Jobber GraphQL field names may need adjustment for your app scopes/account. Test in sandbox first.' }, { status:500, headers:{'Cache-Control':'no-store'} })
  }
}
