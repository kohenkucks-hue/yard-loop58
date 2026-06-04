export const dynamic = 'force-dynamic'
import { requireAdmin } from '../../lib/adminAuth.js'
import { hasBlobToken } from '../../lib/blobJson.js'

// V25: esc() applied to ALL dynamic values before PDF injection
function esc(v=''){
  return String(v).replace(/[()\\]/g,'\\$&').slice(0, 120)
}
function money(n){ return `$${Math.round(Number(n||0)).toLocaleString()}` }

function pdfBuffer(lines=[]){
  const content = [
    'BT',
    '/F1 18 Tf',
    '72 740 Td',
    `(${esc('Yard Loop Signed Property Plan')}) Tj`,
    '/F1 10 Tf',
    '0 -26 Td',
    ...lines.flatMap(line=>[`(${esc(line)}) Tj`, '0 -16 Td']),
    'ET'
  ].join('\n')

  const objects=[]
  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj')
  objects.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj')
  objects.push('3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj')
  objects.push('4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj')
  objects.push(`5 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj`)

  let out='%PDF-1.4\n'
  const offsets=[0]
  for(const obj of objects){ offsets.push(Buffer.byteLength(out)); out+=obj+'\n' }
  const start=Buffer.byteLength(out)
  out+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach(o=>{ out+=String(o).padStart(10,'0')+' 00000 n \n' })
  out+=`trailer << /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`
  return Buffer.from(out)
}

export async function POST(req){
  const denied = requireAdmin(req)
  if(denied) return denied

  let body = {}
  try{
    const raw = await req.text()
    if(raw.length > 100_000) return Response.json({ok:false,error:'Request body too large. Limit is 100 KB.'},{status:413})
    body = raw ? JSON.parse(raw) : {}
  }catch(e){
    return Response.json({ok:false,error:'Invalid JSON body.'},{status:400})
  }
  const { customer={}, estimate={}, contract={} } = body

  const services = contract.serviceLabels || (customer.selectedServices||[])
  // V25: all fields pass through esc() consistently in pdfBuffer — applied here for clarity
  const lines = [
    `Customer: ${customer.name||contract.customerName||''}`,
    `Address: ${customer.address||contract.address||''}`,
    `Phone: ${customer.phone||''}`,
    `Email: ${customer.email||''}`,
    `Monthly plan price: ${money(customer.monthly||contract.monthly)}`,
    `Annual plan value: ${money(customer.annual||contract.annual)}`,
    `Services: ${Array.isArray(services)?services.join(', '):services}`,
    `Payment status: ${customer.paymentStatus||customer.billingStatus||'Not collected'}`,
    `Signed by: ${contract.signatureName||customer.name||''}`,
    `Signed at: ${contract.signedAt||new Date().toISOString()}`,
    `Signature: Captured digitally via Yard Loop CRM`,
    `Signature name: ${contract.signatureName||customer.name||''}`,
    'Original signature image remains on file in the Yard Loop CRM record.',
    'One Plan. All Year. Total Peace of Mind.'
  ]

  const pdf=pdfBuffer(lines)

  if(!hasBlobToken()) return new Response(JSON.stringify({ok:true,skipped:true,note:'Blob not connected; PDF generated but not stored.'}),{status:200,headers:{'Content-Type':'application/json'}})

  const { put } = await import('@vercel/blob')
  const path = `contracts/yard-loop-contract-${customer.id||Date.now()}.pdf`
  const blob = await put(path, pdf, { access:'private', addRandomSuffix:false, allowOverwrite:true, contentType:'application/pdf', token:process.env.BLOB_READ_WRITE_TOKEN })
  return Response.json({ok:true,contractUrl:blob.url,contractPath:path})
}
