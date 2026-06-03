'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { isVisible } from '../lib/content'

export default function MobileNav({ links, c }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  const close = () => setOpen(false)
  const href = p => p === 'estimate' ? '/estimate' : p === 'getMyPlan' ? '/get-my-plan' : p === 'contact' ? '/contact' : `/${p}`
  return <>
    <button className={`hamburger${open?' open':''}`} onClick={()=>setOpen(o=>!o)} aria-label="Menu">
      <span/><span/><span/>
    </button>
    <div className={`mobileMenu${open?' open':''}`} onClick={close}>
      <div className="mobileDrawer" onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <b style={{fontSize:17,color:'var(--navy,#071a2f)'}}>{c.brand?.name}</b>
          <button onClick={close} style={{background:'none',border:'none',fontSize:24,cursor:'pointer',color:'#5a7080',lineHeight:1}}>✕</button>
        </div>
        {links.map(l=><Link href={l.href} key={l.key} onClick={close}>{l.label}</Link>)}
        <Link href="/contact" className="mobileCta" onClick={close} style={{marginTop:8}}>Talk With Yard Loop</Link>
        {c.getMyPlan?.showButtons !== false && c.modules?.showPlanButtons !== false && isVisible(c,'getMyPlan') && <Link href="/get-my-plan" className="mobileCta" onClick={close} style={{background:'var(--btnBg,#2f7d32)',color:'var(--btnText,#fff)',marginTop:8}}>Get My Plan</Link>}
        {c.brand?.phone && <a href={`tel:${c.brand.phone.replace(/\D/g,'')}`} style={{display:'block',textAlign:'center',marginTop:12,fontWeight:700,color:'var(--green,#2f7d32)',fontSize:16}}>{c.brand.phone}</a>}
      </div>
    </div>
  </>
}
