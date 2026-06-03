'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import '../style.css'

function CheckoutInner(){
  const sp=useSearchParams(); const [msg,setMsg]=useState('')
  async function start(){
    setMsg('Opening secure checkout...')
    const r=await fetch('/api/stripe/public-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customerId:sp.get('customerId'),token:sp.get('token')})})
    const j=await r.json().catch(()=>({}))
    if(j.checkoutUrl) location.href=j.checkoutUrl
    else setMsg(j.error||'Checkout is not ready yet. Contact Yard Loop.')
  }
  return <main className="page"><section className="section"><div className="container narrow"><h1>Yard Loop Payment Setup</h1><p>Use this secure link to set up your Yard Loop monthly plan payment.</p><button className="btn primary" onClick={start}>Continue to Secure Checkout</button>{msg&&<p>{msg}</p>}</div></section></main>
}

export default function CheckoutPage(){
  return <Suspense fallback={<main className="page"><section className="section"><div className="container narrow"><h1>Loading payment setup…</h1></div></section></main>}><CheckoutInner/></Suspense>
}
