'use client'
import { useState } from 'react'

const DEFAULT_PLANS = [
  {
    id:'essential',
    name:'Essential Plan',
    tagline:'The lawn care basics covered.',
    services:['Lawn Mowing','Spring Cleanup','Fall Cleanup']
  },
  {
    id:'premium',
    name:'Premium Plan',
    tagline:'A healthier, greener, professionally maintained yard.',
    services:['Lawn Mowing','Spring Cleanup','Fall Cleanup','Fertilizer & Weed Control','Core Aeration','Exterior Pest & Insect Control']
  },
  {
    id:'peace',
    name:'Total Peace of Mind Plan',
    tagline:'One Plan. All Year. Total Peace of Mind.',
    services:['Lawn Mowing','Spring Cleanup','Fall Cleanup','Fertilizer & Weed Control','Core Aeration','Exterior Pest & Insect Control','Mulch Refresh','Shrub Trimming','Gutter Cleaning','Window Cleaning','House Wash','Driveway / Concrete Wash','Deck / Patio Wash']
  },
  {
    id:'custom',
    name:'Customize My Plan',
    tagline:'Build the perfect plan for your home.',
    services:['Pick only the services you want Yard Loop to review for your custom plan.']
  }
]

const TERMS_TEXT = 'I understand that by submitting this form, I am requesting Yard Loop to contact me, review my property, and provide an estimate. Submission of this form does not create a service agreement or require me to purchase a plan.'

export default function GetMyPlanClient({ c }){
  const tiers=(c.estimator?.tiers||[]).filter(t=>t.enabled!==false)
  const services=(c.estimator?.services||[]).filter(s=>s.enabled!==false)
  const g=c.getMyPlan||{}
  const plans=(g.packages&&g.packages.length?g.packages:DEFAULT_PLANS).filter(p=>p.enabled!==false)
  const firstPlan=plans[0]?.id||'essential'
  const [form,setForm]=useState({name:'',phone:'',email:'',address:'',city:'',propertyStyle:tiers[0]?.name||'',selectedPackage:firstPlan,selectedServices:[],removeMowing:false,preferredContact:'Phone call',message:'',termsAccepted:false})
  const [sent,setSent]=useState(false)

  const selectedPlan=plans.find(p=>p.id===form.selectedPackage)||plans[0]
  const isCustom=form.selectedPackage==='custom'
  const visiblePlanServices=(selectedPlan?.services||[]).filter(s=>!(form.removeMowing&&String(s).toLowerCase().includes('mowing')))
  const chosenCustom=services.filter(s=>form.selectedServices.includes(s.id))
  function toggle(id){ setForm(f=>({...f,selectedServices:f.selectedServices.includes(id)?f.selectedServices.filter(x=>x!==id):[...f.selectedServices,id]})) }

  async function submit(e){
    e.preventDefault()
    if(!form.termsAccepted) return
    const selectedServices = isCustom
      ? chosenCustom.map(s=>`${s.name} ${s.frequency||''}`.trim()).join(', ')
      : visiblePlanServices.join(', ')
    const notes = [
      form.message,
      form.removeMowing ? 'Customer requested mowing removed from selected package.' : '',
      `Estimate request acknowledged: ${TERMS_TEXT}`
    ].filter(Boolean).join('\n\n')
    const body={...form,source:'Get My Plan Page',tier:form.propertyStyle,package:selectedPlan?.name||'',selectedPackage:selectedPlan?.name||'',selectedServices,status:'New',notes}
    const r=await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    if(r.ok)setSent(true)
  }

  if(sent) return <section className="estimateSuccess"><h2>{g.successHeadline||'Your request was sent.'}</h2><p>{g.successText||'Yard Loop will review your property details and follow up.'}</p><a className="btn" href="/">Back Home</a></section>
  return <div className="estimatorGrid customPlanGrid">
    <div className="estimateBuilder">
      <section className="estimateStep"><div className="stepHead"><b>1</b><div><h2>{g.propertyLabel||'My property style'}</h2><p>Choose the option that feels closest. No acreage guessing required.</p></div></div><div className="tierGrid">{tiers.map(t=><button type="button" key={t.id} className={form.propertyStyle===t.name?'tier active':'tier'} onClick={()=>setForm({...form,propertyStyle:t.name})}><strong>{t.name}</strong><span>{t.yardRange}</span><span>{t.homeRange}</span><small>Custom monthly plan reviewed by Yard Loop</small></button>)}</div></section>

      <section className="estimateStep"><div className="stepHead"><b>2</b><div><h2>{g.packageLabel||'Choose your Yard Loop package'}</h2><p>{g.packageSubtext||'Start with a ready-made plan or customize your own. No prices are shown here until Yard Loop reviews the property.'}</p></div></div><div className="packageGrid">{plans.map(p=><button type="button" key={p.id} className={form.selectedPackage===p.id?'planPackage active':'planPackage'} onClick={()=>setForm(f=>({...f,selectedPackage:p.id}))}><div><strong>{p.name}</strong><small>{p.tagline}</small></div><ul>{(p.services||[]).map(x=><li key={x}>{x}</li>)}</ul><b>{form.selectedPackage===p.id?'✓ Selected':'Select Plan'}</b></button>)}</div></section>

      <section className="estimateStep mowingRemoveBox"><div className="stepHead"><b>3</b><div><h2>{g.removeMowingHeadline||'Already have mowing covered?'}</h2><p>{g.removeMowingText||'Check this if you want Yard Loop to review the selected package without lawn mowing included.'}</p></div></div><label className="checkRow"><input type="checkbox" checked={form.removeMowing} onChange={e=>setForm({...form,removeMowing:e.target.checked})}/><span>Remove mowing from my selected package</span></label></section>

      {isCustom&&<section className="estimateStep"><div className="stepHead"><b>4</b><div><h2>{g.servicesLabel||'Services I may want included'}</h2><p>Pick any services you may want included. This list uses the same live service bank as the estimator.</p></div></div><div className="servicePickGrid">{services.map(s=><button type="button" key={s.id} className={form.selectedServices.includes(s.id)?'servicePick active':'servicePick'} onClick={()=>toggle(s.id)}><span>{s.name}</span><small>{s.frequency}</small><b>{form.selectedServices.includes(s.id)?'✓ Added':'Add'}</b></button>)}</div></section>}

      <section className="estimateStep"><div className="stepHead"><b>{isCustom?'5':'4'}</b><div><h2>{g.formHeadline||'Request My Custom Monthly Plan'}</h2><p>{g.formSubtext||'Tell us where to reach you and what matters most.'}</p></div></div><form className="leadMiniForm" onSubmit={submit}><input required placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input required placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Property address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/><input placeholder="City" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/><select value={form.preferredContact} onChange={e=>setForm({...form,preferredContact:e.target.value})}><option>Phone call</option><option>Text message</option><option>Email</option></select><textarea placeholder={g.notesPlaceholder||'Tell us anything helpful about your property.'} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/><div className="termsBox"><h3>Estimate request acknowledgement</h3><p>{g.estimateConsentSummary||TERMS_TEXT}</p><label className="checkRow required"><input required type="checkbox" checked={form.termsAccepted} onChange={e=>setForm({...form,termsAccepted:e.target.checked})}/><span>{g.estimateConsentText||TERMS_TEXT}</span></label></div><button className="btn" type="submit">{g.buttonText||'Request My Plan'}</button></form></section>
    </div>
    <aside className="estimateSummary"><div className="stickySummary"><p className="eyebrow">{g.heroEyebrow||'Get My Plan'}</p><h2 style={{fontSize:'clamp(28px,4vw,46px)',lineHeight:1.05}}>{selectedPlan?.name||g.heroHeadline||'Your home exterior. Fully handled.'}</h2><p>{selectedPlan?.tagline||g.heroSubtext||'Tell us about your property and Yard Loop will create a custom monthly plan.'}</p><div className="selectedList"><b>Selected package services</b>{isCustom?(chosenCustom.length?chosenCustom.map(s=><span key={s.id}>✓ {s.name} — {s.frequency}</span>):<span>Choose custom services to include.</span>):visiblePlanServices.map(s=><span key={s}>✓ {s}</span>)}{form.removeMowing&&<span>✓ Mowing removal requested</span>}</div><div className="selectedList"><b>Why this helps</b>{(g.trustBullets||[]).map(x=><span key={x}>✓ {x}</span>)}</div><p className="fine">Custom plan requests are not final quotes. Final pricing may change after property review, satellite measurement, service-provider feedback, access, safety, and scope review.</p></div></aside>
  </div>
}
