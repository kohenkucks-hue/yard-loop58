'use client'
import { useMemo, useState } from 'react'

const money = n => `$${Math.round(Number(n||0)).toLocaleString()}`

function CustomPlanRequest({ c }){
 const g=c.getMyPlan||{}
 const tiers=(c.estimator?.tiers||[]).filter(t=>t.enabled!==false)
 const services=(c.estimator?.services||[]).filter(s=>s.enabled!==false)
 const [form,setForm]=useState({name:'',phone:'',email:'',address:'',city:'',propertyStyle:tiers[0]?.name||'',preferredContact:'Phone call',selectedServices:[],message:''})
 const [sent,setSent]=useState(false)
 function toggle(id){ setForm(f=>({...f,selectedServices:f.selectedServices.includes(id)?f.selectedServices.filter(x=>x!==id):[...f.selectedServices,id]})) }
 async function submit(e){
  e.preventDefault()
  const serviceNames=services.filter(s=>form.selectedServices.includes(s.id)).map(s=>`${s.name} ${s.frequency}`).join(', ')
  const body={name:form.name,phone:form.phone,email:form.email,address:form.address,city:form.city,source:'Get My Plan',tier:form.propertyStyle,selectedServices:serviceNames,points:'Custom',monthly:'',annual:'',status:'New',notes:`Preferred contact: ${form.preferredContact}\n${form.message||''}`}
  const r=await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  if(r.ok)setSent(true)
 }
 if(sent) return <section className="estimateSuccess"><h2>{g.successHeadline||'Your request was sent.'}</h2><p>{g.successText||'Yard Loop will review your property details and follow up.'}</p><a className="btn" href="/">Back Home</a></section>
 return <div className="estimatorGrid customPlanGrid">
  <div className="estimateBuilder">
   <section className="estimateStep"><div className="stepHead"><b>1</b><div><h2>{g.propertyLabel||'My property style'}</h2><p>Choose the option that feels closest. No acreage guessing required.</p></div></div><div className="tierGrid">{tiers.map(t=><button type="button" key={t.id} className={form.propertyStyle===t.name?'tier active':'tier'} onClick={()=>setForm({...form,propertyStyle:t.name})}><strong>{t.name}</strong><span>{t.yardRange}</span><span>{t.homeRange}</span><small>Custom monthly plan reviewed by Yard Loop</small></button>)}</div></section>
   <section className="estimateStep"><div className="stepHead"><b>2</b><div><h2>{g.servicesLabel||'Services I may want included'}</h2><p>Pick anything you may want. Yard Loop can help finalize the right plan.</p></div></div><div className="servicePickGrid">{services.map(s=><button type="button" key={s.id} className={form.selectedServices.includes(s.id)?'servicePick active':'servicePick'} onClick={()=>toggle(s.id)}><span>{s.name}</span><small>{s.frequency}</small><b>{form.selectedServices.includes(s.id)?'✓ Added':'Add'}</b></button>)}</div></section>
   <section className="estimateStep"><div className="stepHead"><b>3</b><div><h2>{g.formHeadline||'Request My Custom Monthly Plan'}</h2><p>{g.formSubtext||'Tell us where to reach you and what matters most.'}</p></div></div><form className="leadMiniForm" onSubmit={submit}><input required placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input required placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Property address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/><input placeholder="City" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/><select value={form.preferredContact} onChange={e=>setForm({...form,preferredContact:e.target.value})}><option>Phone call</option><option>Text message</option><option>Email</option></select><textarea placeholder={g.notesPlaceholder||'Tell us anything helpful about your property.'} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/><button className="btn" type="submit">{g.buttonText||'Request My Plan'}</button></form></section>
  </div>
  <aside className="estimateSummary"><div className="stickySummary"><p className="eyebrow">{g.heroEyebrow||'Get My Plan'}</p><h2 style={{fontSize:'clamp(28px,4vw,46px)',lineHeight:1.05}}>{g.heroHeadline||'Your home exterior. Fully handled.'}</h2><p>{g.heroSubtext||'Tell us about your property and Yard Loop will create a custom monthly plan.'}</p><div className="selectedList"><b>Why this helps</b>{(g.trustBullets||[]).map(x=><span key={x}>✓ {x}</span>)}</div><p className="fine">Custom plan requests are not final quotes. Final pricing may change after property review, satellite measurement, service-provider feedback, access, safety, and scope review.</p></div></aside>
 </div>
}

function InstantEstimator({ c }){
 const tiers=(c.estimator?.tiers||[]).filter(t=>t.enabled!==false)
 const services=(c.estimator?.services||[]).filter(s=>s.enabled!==false)
 const [tierId,setTierId]=useState(tiers[0]?.id||'small')
 const [selected,setSelected]=useState([])
 const [extra,setExtra]=useState(false)
 const [form,setForm]=useState({name:'',phone:'',email:'',address:'',message:''})
 const [sent,setSent]=useState(false)
 const tier=tiers.find(t=>t.id===tierId)||tiers[0]||{}
 const picked=services.filter(s=>selected.includes(s.id))
 const points=picked.reduce((a,s)=>a+Number(s.points||0),0)
 const contractor=picked.reduce((a,s)=>a+Number(s.contractorCost||0),0)
 const pointsCost=points*Number(tier.pricePerPoint||0)
 const extraCost=extra?Number(tier.mowingUpgrade||0):0
 const monthly=Number(tier.basePrice||0)+pointsCost+extraCost
 const annual=monthly*12
 const annualCost=(Number(tier.basePrice||0)*.55*12)+contractor+(extraCost*.55*12)
 const margin=annual?Math.round(((annual-annualCost)/annual)*100):0
 function toggle(id){ setSelected(x=>x.includes(id)?x.filter(y=>y!==id):[...x,id]) }
 async function submit(e){ e.preventDefault(); const body={...form,source:'Estimator',tier:tier.name,selectedServices:picked.map(s=>`${s.name} ${s.frequency}`).join(', '),points,monthly,annual,status:'New',notes:''}; const r=await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); if(r.ok)setSent(true) }
 if(sent) return <div className="estimateSuccess"><h2>Plan request sent to Yard Loop.</h2><p>We received your preliminary plan request. Yard Loop will review the property details and follow up.</p><a className="btn" href="/">Back Home</a></div>
 return <div className="estimatorGrid">
  <div className="estimateBuilder">
   <section className="estimateStep"><div className="stepHead"><b>1</b><div><h2>Tell Us About Your Property</h2><p>Choose the property style that feels closest. No acreage guessing required.</p></div></div><div className="tierGrid">{tiers.map(t=><button type="button" key={t.id} className={tierId===t.id?'tier active':'tier'} onClick={()=>setTierId(t.id)}><strong>{t.name}</strong><span>{t.yardRange}</span><span>{t.homeRange}</span><small>{money(t.basePrice)}/mo starting base</small></button>)}</div></section>
   <section className="estimateStep"><div className="stepHead"><b>2</b><div><h2>Customize Your Yard Loop Plan</h2><p>Base recurring lawn care comes first. Add the exterior services you want handled.</p></div></div><div className="servicePickGrid">{services.map(s=><button type="button" key={s.id} className={selected.includes(s.id)?'servicePick active':'servicePick'} onClick={()=>toggle(s.id)}><span>{s.name}</span><small>{s.frequency}</small><b>{s.points} pts</b></button>)}</div></section>
   <section className="estimateStep"><div className="stepHead"><b>3</b><div><h2>Optional mowing upgrade</h2><p>Add 12 extra cuts per year if the lawn needs a tighter schedule.</p></div></div><button type="button" className={extra?'wideToggle active':'wideToggle'} onClick={()=>setExtra(!extra)}>{extra?'✓ Extra mowing upgrade added':'Add extra mowing upgrade'} <strong>{money(tier.mowingUpgrade)}/mo</strong></button></section>
   <section className="estimateStep"><div className="stepHead"><b>4</b><div><h2>Send plan request</h2><p>This saves into the admin lead dashboard with the plan details.</p></div></div><form className="leadMiniForm" onSubmit={submit}><input required placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input required placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Service address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/><textarea placeholder="Notes, gate code, snow concerns, timing, etc." value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/><button className="btn" type="submit">Request My Plan</button></form></section>
  </div>
  <aside className="estimateSummary"><div className="stickySummary"><p className="eyebrow">Live monthly plan estimate</p><h2>{money(monthly)}<span>/month</span></h2><div className="sumRows"><p><span>Base property plan</span><b>{money(tier.basePrice)}</b></p><p><span>Total internal points</span><b>{points}</b></p><p><span>Add-on value</span><b>{money(pointsCost)}</b></p><p><span>Extra mowing</span><b>{money(extraCost)}</b></p><p className="total"><span>Annual plan value</span><b>{money(annual)}</b></p></div>{c.modules?.marginProtection && <div className={margin < Number(c.estimator.marginTarget||0) ? 'marginWarn bad':'marginWarn'}><b>Internal margin estimate: {margin}%</b><span>{margin < Number(c.estimator.marginTarget||0) ? 'Below target — review pricing before approving.' : 'At or above target based on admin cost estimates.'}</span></div>}<div className="selectedList"><b>Selected services</b>{picked.length?picked.map(s=><span key={s.id}>{s.name} — {s.frequency}</span>):<span>No services selected yet.</span>}</div><p className="fine">{c.estimator.disclaimer}</p><p className="fine">{c.estimator.correction}</p></div></aside>
 </div>
}

export default function EstimatorClient({ c }){
 return <InstantEstimator c={c}/>
}
