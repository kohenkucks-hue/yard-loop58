import { NextResponse } from 'next/server'

export function adminPasswordConfigured(){
  return Boolean(process.env.ADMIN_PASSWORD)
}

export function requireAdmin(req){
  if(!adminPasswordConfigured()){
    return NextResponse.json({ ok:false, error:'ADMIN_PASSWORD is not configured in Vercel.' }, { status:500, headers:{'Cache-Control':'no-store'} })
  }
  const pass = req.headers.get('x-admin-password')
  if(pass !== process.env.ADMIN_PASSWORD){
    return NextResponse.json({ ok:false, error:'Wrong admin password.' }, { status:401, headers:{'Cache-Control':'no-store'} })
  }
  return null
}
