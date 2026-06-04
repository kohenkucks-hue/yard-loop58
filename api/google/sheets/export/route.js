export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/adminAuth'
import { googleApi } from '../../../../lib/google'
function rowsFor(kind,data){
  const list=kind==='jobs'?data.jobs:kind==='leads'?data.leads:kind==='revenue'?data.customers:data.customers
  if(kind==='revenue') return [['Name','Address','Monthly','Annual','Status'],...(list||[]).map(c=>[c.name||c.customerName||'',c.address||'',c.monthly||'',Number(c.monthly||0)*12,c.status||''])]
  const keys=['name','customerName','address','phone','email','status','service','monthly','assignedTo','repName','due','createdAt']
  return [keys,(list||[]).map(item=>keys.map(k=>item?.[k]??''))].flatMap((r,i)=>i===0?[r]:[r])
}
export async function POST(req){
  const denied=requireAdmin(req); if(denied) return denied
  try{
    const {kind='customers',data={}}=await req.json()
    const title=`Yard Loop ${kind} export ${new Date().toISOString().slice(0,10)}`
    const sheet=await googleApi('https://sheets.googleapis.com/v4/spreadsheets',{method:'POST',body:JSON.stringify({properties:{title}})})
    const values=rowsFor(kind,data)
    await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${sheet.spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,{method:'POST',body:JSON.stringify({values})})
    return NextResponse.json({ok:true,spreadsheetId:sheet.spreadsheetId,spreadsheetUrl:sheet.spreadsheetUrl})
  }catch(e){return NextResponse.json({ok:false,error:e.message},{status:500})}
}
