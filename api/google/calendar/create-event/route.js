export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/adminAuth'
import { googleApi, googleEnv } from '../../../../lib/google'
function isoForDate(date,hour=9){ const d=date||new Date().toISOString().slice(0,10); return `${d}T${String(hour).padStart(2,'0')}:00:00` }
export async function POST(req){
  const denied=requireAdmin(req); if(denied) return denied
  try{
    const {job={}}=await req.json()
    if(!job.address) return NextResponse.json({ok:false,error:'Job address is required.'},{status:400})
    const env=googleEnv()
    const event={summary:`Yard Loop: ${job.service||'Service'} - ${job.customerName||job.address}`,location:job.address,description:`Customer: ${job.customerName||''}\nService: ${job.service||''}\nStatus: ${job.status||''}\nNotes: ${job.notes||''}`,start:{dateTime:isoForDate(job.due||job.date,9),timeZone:'America/Chicago'},end:{dateTime:isoForDate(job.due||job.date,10),timeZone:'America/Chicago'}}
    const created=await googleApi(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.calendarId||'primary')}/events`,{method:'POST',body:JSON.stringify(event)})
    return NextResponse.json({ok:true,eventId:created.id,htmlLink:created.htmlLink})
  }catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})}
}
