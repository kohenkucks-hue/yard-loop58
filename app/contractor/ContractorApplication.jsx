'use client'
import { useState } from 'react'

const defaultServices = ['Lawn mowing','Gutter cleaning','Exterior window cleaning','House washing','Driveway/concrete washing','Deck washing','Mulching','Outdoor insect control','Fertilizer/weed control','Shrub trimming','Aeration','Sprinkler blowout','Snow/seasonal add-ons']

export default function ContractorApplication({ c }) {
  const services = c?.contractor?.application?.serviceOptions?.length ? c.contractor.application.serviceOptions : defaultServices
  const [form, setForm] = useState({
    leadType:'contractor', status:'New Applicant', company:'', name:'', phone:'', email:'', serviceArea:'', years:'', crewSize:'', insured:'', licensed:'', equipment:'', availability:'', services:[], notes:''
  })
  const [status, setStatus] = useState('')
  function set(k,v){ setForm(f=>({...f,[k]:v})) }
  function toggleService(s){ setForm(f=>({ ...f, services: f.services.includes(s) ? f.services.filter(x=>x!==s) : [...f.services, s] })) }
  async function submit(e){
    e.preventDefault(); setStatus('Sending...')
    const payload = { ...form, selectedServices: form.services.join(', '), address: form.serviceArea, tier:'Contractor Applicant' }
    const r = await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    setStatus(r.ok ? (c?.contractor?.application?.successText || 'Application received. Yard Loop will review your information and follow up.') : 'Something went wrong. Please call or email Yard Loop.')
    if(r.ok) setForm({leadType:'contractor', status:'New Applicant', company:'', name:'', phone:'', email:'', serviceArea:'', years:'', crewSize:'', insured:'', licensed:'', equipment:'', availability:'', services:[], notes:''})
  }
  return <form className="contractorForm" onSubmit={submit}>
    <div className="formGrid">
      <label><span>Company Name</span><input required value={form.company} onChange={e=>set('company',e.target.value)} /></label>
      <label><span>Contact Name</span><input required value={form.name} onChange={e=>set('name',e.target.value)} /></label>
      <label><span>Phone</span><input required value={form.phone} onChange={e=>set('phone',e.target.value)} /></label>
      <label><span>Email</span><input required type="email" value={form.email} onChange={e=>set('email',e.target.value)} /></label>
      <label><span>Primary Service Areas</span><input value={form.serviceArea} onChange={e=>set('serviceArea',e.target.value)} placeholder="Omaha, Council Bluffs, Bellevue..." /></label>
      <label><span>Years in Business</span><input value={form.years} onChange={e=>set('years',e.target.value)} /></label>
      <label><span>Crew Size</span><input value={form.crewSize} onChange={e=>set('crewSize',e.target.value)} /></label>
      <label><span>Current Availability</span><input value={form.availability} onChange={e=>set('availability',e.target.value)} placeholder="Open days, weekly capacity, seasonal availability" /></label>
      <label><span>General Liability Insurance?</span><select required value={form.insured} onChange={e=>set('insured',e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option><option>In progress</option></select></label>
      <label><span>Licensed where required?</span><select required value={form.licensed} onChange={e=>set('licensed',e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option><option>Not applicable</option></select></label>
    </div>
    <div className="serviceCheckPanel"><b>Services Offered</b><div className="serviceCheckGrid">{services.map(s=><button type="button" key={s} className={form.services.includes(s)?'selected':''} onClick={()=>toggleService(s)}>{s}</button>)}</div></div>
    <label className="wideLabel"><span>Equipment / Crew Notes</span><textarea value={form.equipment} onChange={e=>set('equipment',e.target.value)} placeholder="Tell us about trucks, trailers, mowers, pressure washers, crews, insurance/W9 readiness, etc." /></label>
    <label className="wideLabel"><span>Anything else Yard Loop should know?</span><textarea value={form.notes} onChange={e=>set('notes',e.target.value)} /></label>
    <p className="finePrint">{c?.contractor?.application?.disclaimer}</p>
    <button className="btn" type="submit">{c?.contractor?.application?.buttonText || 'Apply to Partner With Yard Loop'}</button>
    {status && <p className="statusMsg">{status}</p>}
  </form>
}
