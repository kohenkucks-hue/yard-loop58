'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import '../style.css'

const STORAGE = 'yard-loop-crm-operations-v7'
const uid = (p='id') => `${p}_${globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Array.from({length:16},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join('')}`
const today = () => new Date().toISOString().slice(0,10)
const money = n => `$${Math.round(Number(n||0)).toLocaleString()}`
const pct = n => `${Number(n||0).toFixed(1)}%`
const clone = obj => JSON.parse(JSON.stringify(obj || {}))
const norm = v => String(v||'').trim().toLowerCase().replace(/\s+/g,' ')
const daysFromNow = n => new Date(Date.now()+Number(n||0)*86400000).toISOString().slice(0,10)
const daysUntil = d => d ? Math.ceil((new Date(d).getTime()-Date.now())/86400000) : 9999
const fieldText = obj => Object.values(obj||{}).flatMap(v=>Array.isArray(v)?v:[v]).filter(v=>['string','number','boolean'].includes(typeof v)).join(' ').toLowerCase()
const matchesSearch = (obj,q) => !q || fieldText(obj).includes(String(q||'').toLowerCase().trim())
function nextDueForService(serviceId, serviceLabel=''){
  const id=String(serviceId||serviceLabel||'').toLowerCase()
  if(id.includes('mow')) return daysFromNow(7)
  if(id.includes('gutter')) return daysFromNow(14)
  if(id.includes('window')) return daysFromNow(21)
  if(id.includes('sprinkler')) return daysFromNow(120)
  if(id.includes('insect')) return daysFromNow(30)
  if(id.includes('mulch')) return daysFromNow(45)
  return daysFromNow(14)
}
function scoreToGrade(score){return score>=97?'A+':score>=90?'A':score>=80?'B':score>=70?'C':score>=60?'D':'F'}

const services = {
  mowing:{label:'Lawn Mowing',icon:'🌱',category:'Core',defaultAnnual:28,basePoints:10,baseCost:520,hidden:false,freqs:[['28 mowings / year',28],['Weekly season',28],['Twice weekly season',48],['Every 10 days',18],['One-time member add-on',1]],quick:['Small turf','Medium turf','Large turf','XL turf']},
  gutters:{label:'Gutter Cleaning',icon:'🏠',category:'Core',defaultAnnual:2,basePoints:6,baseCost:140,hidden:false,freqs:[['1x/year',1],['2x/year',2],['Quarterly',4],['One-time member add-on',1]],quick:['Under 125 LF','125–175 LF','175–250 LF','250+ LF']},
  windows:{label:'Window Cleaning',icon:'🪟',category:'Core',defaultAnnual:2,basePoints:8,baseCost:180,hidden:false,freqs:[['1x/year',1],['2x/year',2],['4x/year',4],['Quarterly',4],['One-time member add-on',1]],quick:['Under 15 windows','15–25 windows','26–40 windows','40+ windows']},
  housewash:{label:'House Wash / Soft Wash',icon:'💦',category:'Core',defaultAnnual:1,basePoints:10,baseCost:250,hidden:false,freqs:[['Annual',1],['Every 2 years',0.5],['2x/year',2],['One-time member add-on',1]],quick:['Small home','Medium home','Large home','XL home']},
  concrete:{label:'Driveway / Concrete Wash',icon:'🧽',category:'Add-on',defaultAnnual:1,basePoints:6,baseCost:160,hidden:false,freqs:[['Annual',1],['2x/year',2],['One-time member add-on',1]],quick:['Short driveway','Standard driveway','Long driveway','Driveway + sidewalks']},
  deck:{label:'Deck / Patio Wash',icon:'🪵',category:'Add-on',defaultAnnual:1,basePoints:5,baseCost:150,hidden:false,freqs:[['Annual',1],['2x/year',2],['One-time member add-on',1]],quick:['Small deck','Medium deck','Large deck','Deck + stairs']},
  mulch:{label:'Mulch / Bed Refresh',icon:'🌿',category:'Core',defaultAnnual:1,basePoints:9,baseCost:300,hidden:false,freqs:[['Annual',1],['Spring + fall',2],['Every other year',0.5],['One-time member add-on',1]],quick:['Small beds','Medium beds','Large beds','XL beds']},
  sprinkler:{label:'Sprinkler Blowout',icon:'💧',category:'Seasonal',defaultAnnual:1,basePoints:4,baseCost:85,hidden:false,freqs:[['Annual',1],['One-time member add-on',1]],quick:['4 zones','6 zones','8 zones','10+ zones']},
  insects:{label:'Outdoor Insect Control',icon:'🦟',category:'Seasonal',defaultAnnual:3,basePoints:6,baseCost:180,hidden:false,freqs:[['3 apps/year',3],['Monthly seasonal',6],['6 apps/year',6],['One-time member add-on',1]],quick:['Small lot','Medium lot','Large lot','Wooded / heavy insects']},
  dogpoop:{label:'Dog Poop Pickup',icon:'🐾',category:'Hidden / Future',defaultAnnual:26,basePoints:4,baseCost:260,hidden:true,freqs:[['Bi-weekly',26],['Weekly',52],['Twice weekly',104],['One-time cleanup',1]],quick:['One dog','Two dogs','Three dogs','Heavy cleanup']},
  holiday:{label:'Christmas / Holiday Lights',icon:'✨',category:'Hidden / Future',defaultAnnual:1,basePoints:12,baseCost:450,hidden:true,freqs:[['Seasonal install + removal',1],['Install only',0.7],['Removal only',0.35],['Permanent light service',1]],quick:['Small roofline','Standard roofline','Large roofline','Roofline + trees']},
  planters:{label:'Plant Potting / Seasonal Planters',icon:'🪴',category:'Hidden / Future',defaultAnnual:2,basePoints:5,baseCost:180,hidden:true,freqs:[['Spring + fall',2],['Quarterly',4],['One-time',1]],quick:['2 pots','4 pots','6 pots','Custom planters']},
  shrubs:{label:'Shrub Trimming',icon:'✂️',category:'Core',defaultAnnual:2,basePoints:5,baseCost:150,hidden:false,freqs:[['Weekly',36],['Biweekly',18],['Monthly',8],['Quarterly',4],['1x/year',1],['2x/year',2]],quick:['Few shrubs','Standard shrubs','Many shrubs','Large/overgrown']},
  leaves:{label:'Leaf / Seasonal Cleanup',icon:'🍂',category:'Seasonal',defaultAnnual:2,basePoints:7,baseCost:240,hidden:false,freqs:[['Two-time pickup',2],['Three-time pickup',3]],quick:['Small yard','Normal yard','Large yard','Heavy trees']},
  snow:{label:'Snow + Ice Removal',icon:'❄️',category:'Seasonal',defaultAnnual:12,basePoints:8,baseCost:320,hidden:false,freqs:[['Each snowfall',12]],quick:['Small drive/walk','Normal drive/walk','Large drive/walk']},
  fert:{label:'Fertilizer / Weed Control',icon:'🌾',category:'Lawn Care',defaultAnnual:5,basePoints:7,baseCost:230,hidden:false,freqs:[['4–6 visits / year',5]],quick:['Small under 5,000 sq ft','Medium 5,000–10,000 sq ft','Large 10,000–15,000 sq ft']},
  aeration:{label:'Core Aeration',icon:'🕳️',category:'Lawn Care',defaultAnnual:1,basePoints:4,baseCost:90,hidden:false,freqs:[['Once per year',1],['Twice per year',2]],quick:['Small under 5,000 sq ft','Medium 5,000–10,000 sq ft','Large 10,000–15,000 sq ft']},
  overseeding:{label:'Overseeding',icon:'🌱',category:'Lawn Care',defaultAnnual:1,basePoints:5,baseCost:160,hidden:false,freqs:[['1x/year',1],['Spring + fall',2]],quick:['Small under 5,000 sq ft','Medium 5,000–10,000 sq ft','Large 10,000–15,000 sq ft']},
  bins:{label:'Trash Bin Cleaning',icon:'🧼',category:'Add-on',defaultAnnual:6,basePoints:3,baseCost:90,hidden:false,freqs:[['Monthly',12],['Every two months',6],['Quarterly',4]],quick:['1 bin','2 bins','3 bins','4+ bins']},
  roofwash:{label:'Roof Wash',icon:'🏡',category:'Exterior Cleaning',defaultAnnual:1,basePoints:11,baseCost:325,hidden:false,freqs:[['One time',1],['1x/year',1]],quick:['Small roof','Medium roof','Large roof','Steep/difficult roof']},
  custom:{label:'Custom / Other',icon:'➕',category:'Custom',defaultAnnual:1,basePoints:0,baseCost:0,hidden:false,freqs:[['One-time',1],['Recurring monthly',12],['Seasonal',1]],quick:['Small','Medium','Large','Custom']}
}

const serviceConfig = Object.fromEntries(Object.entries(services).map(([id,s])=>[id,{id,enabled:true,label:s.label,category:s.category,basePoints:s.basePoints,baseCost:s.baseCost,defaultAnnual:s.defaultAnnual,frequencies:s.freqs,showQuick:true,showDetailed:true,hidden:s.hidden}]))

const owners = [
  {id:'kevin',name:'Kevin Kucks',username:'kevin',role:'Owner',pin:'0000',email:'',phone:'',active:true,fullAccess:true},
  {id:'jamie',name:'Jamie Kucks',username:'jamie',role:'Owner',pin:'0000',email:'',phone:'',active:true,fullAccess:true},
  {id:'kohen',name:'Kohen Kucks',username:'kohen',role:'Owner',pin:'0000',email:'',phone:'',active:true,fullAccess:true}
]

const baseData = {
  schemaVersion:'yard-loop-crm-operations-v7',
  users:owners,
  prospects:[], leads:[], estimates:[], customers:[], contracts:[], approvals:[], contractors:[], jobs:[], tasks:[], activity:[], doorLogs:[], notes:[], documents:[],
  settings:{
    companyName:'Yard Loop', companyEmail:'info@yard-loop.com', companyPhone:'',
    requiredPaymentBeforeActive:true, estimateExpirationDays:14, capacityEnforcement:'warning',
    minGreenMargin:40, minYellowMargin:30, hardMarginFloor:30, maxRepDiscountPct:10, ownerCounterEnabled:true,
    duplicateLockDays:30, warmLeadDays:90, routeDiscountPct:5,
    serviceAreas:['Omaha','Council Bluffs','Carter Lake','Bellevue','Papillion','La Vista','Gretna','Ralston','Elkhorn','Bennington'],
    masterPricing:{tiers:[
      {id:'small',name:'Small Property',basePrice:149,pricePerPoint:25,enabled:true},
      {id:'medium',name:'Standard Property',basePrice:199,pricePerPoint:35,enabled:true},
      {id:'large',name:'Large Property',basePrice:299,pricePerPoint:50,enabled:true},
      {id:'estate',name:'Estate Property',basePrice:399,pricePerPoint:65,enabled:true}
    ]},
    bundles:[
      {id:'essential',name:'Essential Plan',enabled:true,services:['mowing','gutters','windows']},
      {id:'premium',name:'Premium Plan',enabled:true,services:['mowing','gutters','windows','housewash','mulch','sprinkler']},
      {id:'total',name:'Total Peace of Mind Plan',enabled:true,services:['mowing','gutters','windows','housewash','mulch','sprinkler','shrubs','fert','aeration','snow']},
      {id:'customize',name:'Customize My Plan',enabled:true,services:[]}
    ],
    serviceConfig,
    capacity:[],
    integrations:{
      jobber:{enabled:false,status:'Use Vercel Environment Variables only',lastChecked:'',notes:'Secrets are not stored in this CRM. Add Jobber OAuth values in Vercel, then use backend test routes when built.'},
      payments:{provider:'Stripe',enabled:false,testMode:true,achRequired:true,cardAllowed:true,status:'Use Vercel Environment Variables only',lastChecked:'',notes:'Stripe secret keys and webhook secrets must live in Vercel Environment Variables only.'},
      google:{enabled:false,status:'Use Vercel Environment Variables only',lastChecked:'',notes:'Google Maps/Analytics/OAuth values must live in Vercel Environment Variables only.'},
      email:{enabled:true,provider:'Resend',from:'info@yard-loop.com',ownerEmail:'info@yard-loop.com',replyTo:'info@yard-loop.com',status:'Server-side env only',lastChecked:'',notes:'Resend API key is read server-side from Vercel and is not stored in CRM data.'},
      sms:{enabled:false,provider:'Twilio',status:'Use Vercel Environment Variables only',lastChecked:'',notes:'Twilio Account SID/Auth Token must live in Vercel Environment Variables only.'},
      quickbooks:{enabled:false,status:'Use Vercel Environment Variables only',lastChecked:'',notes:'QuickBooks OAuth credentials/tokens must live in Vercel Environment Variables only.'}
    }
  }
}

const blankDraft = {
  mode:'quick', customerType:'Subscription Plan', status:'Draft', name:'', address:'', phone:'', email:'', city:'',
  propertyTier:'medium', homeType:'Two Story', leadSource:'Door knocking', accountManager:'Kevin Kucks', assignedTo:'Kevin Kucks',
  bundleId:'customize', selectedServices:[], serviceDetails:{}, photos:[], notes:'', paymentStatus:'Not collected', achAuthorized:false,
  signatureName:'', signatureImage:'', discountPct:0, ownerApprovalId:'', ownerApproved:false, ownerApprovedPrice:'', dnc:false
}

function normalizeFreqs(freqs, fallback){
  const src = Array.isArray(freqs)&&freqs.length?freqs:(fallback||[['Annual',1]])
  return src.map(f=>{
    if(Array.isArray(f)) return [String(f[0]||'Annual'),Number(f[1]||1), f[2]===''||f[2]==null?'':Number(f[2]), f[3]===''||f[3]==null?'':Number(f[3])]
    if(typeof f==='object') return [String(f.label||f.name||'Annual'),Number(f.annual||f.times||1), f.points==null?'':Number(f.points), f.cost==null?'':Number(f.cost)]
    return [String(f),1,'','']
  })
}

function mergeData(remote={}){
  const d={...baseData,...(remote||{})}
  d.settings={...baseData.settings,...(remote?.settings||{})}
  d.settings.masterPricing={...baseData.settings.masterPricing,...(remote?.settings?.masterPricing||{})}
  d.settings.masterPricing.tiers=remote?.settings?.masterPricing?.tiers?.length?remote.settings.masterPricing.tiers:baseData.settings.masterPricing.tiers
  d.settings.serviceConfig={...baseData.settings.serviceConfig,...(remote?.settings?.serviceConfig||{})}
  Object.entries(d.settings.serviceConfig).forEach(([id,s])=>{d.settings.serviceConfig[id]={...(serviceConfig[id]||{}),...s,id,frequencies:normalizeFreqs(s.frequencies, serviceConfig[id]?.frequencies)}})
  d.settings.bundles=remote?.settings?.bundles?.length?remote.settings.bundles:baseData.settings.bundles
  d.settings.capacity=remote?.settings?.capacity||baseData.settings.capacity
  const remoteIntegrations = remote?.settings?.integrations || {}
  d.settings.integrations = clone(baseData.settings.integrations)
  Object.entries(remoteIntegrations).forEach(([provider,values])=>{
    d.settings.integrations[provider] = {...(d.settings.integrations[provider]||{}), ...(values||{})}
  })
  d.users=(remote?.users?.length?remote.users:baseData.users).map(u=>({...u,username:u.username||u.id,fullAccess:u.fullAccess||u.role==='Owner'}))
  for(const key of ['prospects','leads','estimates','customers','contracts','approvals','contractors','jobs','tasks','activity','doorLogs','notes','documents']) d[key]=Array.isArray(d[key])?d[key]:[]
  return d
}

function freqOption(cfg, detail){
  const selected = detail?.frequency || cfg?.frequencies?.[0]?.[0] || 'Annual'
  return (cfg?.frequencies||[]).find(f=>String(f[0]||f.label)===String(selected)) || cfg?.frequencies?.[0] || ['Annual',1,'','']
}
function freqFactor(cfg, detail){
  const opt = freqOption(cfg, detail)
  const annual = Number(Array.isArray(opt)?opt[1]:opt?.annual || cfg.defaultAnnual || 1)
  const def = Number(cfg.defaultAnnual || 1) || 1
  return Math.max(0.05, annual / def)
}
function freqPointOverride(cfg, detail){
  const opt=freqOption(cfg, detail)
  const v=Array.isArray(opt)?opt[2]:opt?.points
  return v===''||v==null||Number(v)<=0?null:Number(v)
}
function freqCostOverride(cfg, detail){
  const opt=freqOption(cfg, detail)
  const v=Array.isArray(opt)?opt[3]:opt?.cost
  return v===''||v==null||Number(v)<0?null:Number(v)
}

function calcEstimate(draft,settings){
  const tier=(settings.masterPricing.tiers||[]).find(t=>t.id===draft.propertyTier)||settings.masterPricing.tiers?.[1]||{basePrice:199,pricePerPoint:35}
  let points=0,cost=0
  const breakdown=[]
  ;(draft.selectedServices||[]).forEach(id=>{
    const cfg=settings.serviceConfig?.[id]||serviceConfig[id]||{}
    const detail=draft.serviceDetails?.[id]||{}
    const factor=freqFactor(cfg,detail)
    let difficulty=1
    if(detail.difficulty==='Easy') difficulty=.9
    if(detail.difficulty==='Difficult') difficulty=1.35
    if(detail.difficulty==='Very Difficult') difficulty=1.65
    let p=(freqPointOverride(cfg,detail) ?? (Number(cfg.basePoints||0)*factor))*difficulty
    let c=(freqCostOverride(cfg,detail) ?? (Number(cfg.baseCost||0)*factor))*difficulty
    if(id==='custom'){
      p += Number(detail.customPrice||0)/Math.max(1,Number(tier.pricePerPoint||50))
      c += Number(detail.customCost||0)
    }
    points+=p; cost+=c
    breakdown.push({id,label:cfg.label||id,frequency:detail.frequency||cfg.frequencies?.[0]?.[0]||'Default',factor,points:p,cost:c})
  })
  const preDiscount=Number(tier.basePrice||0)+points*Number(tier.pricePerPoint||0)
  const discountPct=Math.max(0,Number(draft.discountPct||0))
  let monthly=preDiscount*(1-discountPct/100)
  if(draft.ownerApprovedPrice) monthly=Number(draft.ownerApprovedPrice)
  const annual=monthly*12
  const annualCost=cost
  const margin=annual?((annual-annualCost)/annual)*100:0
  const marginStatus=margin>=Number(settings.minGreenMargin||40)?'Green':margin>=Number(settings.minYellowMargin||30)?'Yellow':'Red'
  const discountNeedsApproval=discountPct>Number(settings.maxRepDiscountPct||10)
  const marginNeedsApproval=margin<Number(settings.hardMarginFloor||30)
  const closeLocked=(discountNeedsApproval||marginNeedsApproval)&&!draft.ownerApproved
  const dealGrade=margin>=50?'A+':margin>=40?'A':margin>=30?'B':margin>=20?'C':'D'
  return {tier,points,monthly,annual,annualCost,profit:annual-annualCost,margin,marginStatus,breakdown,discountNeedsApproval,marginNeedsApproval,closeLocked,dealGrade,preDiscount}
}

function Badge({value}){
  const v=String(value||'')
  const green=['Green','Approved','Active','Signed','Completed','Verified','Full Access','Paid','ACH enrolled','Card on file','A+','A'].includes(v)
  const yellow=['Yellow','Pending','Follow Up','Estimate Given','Warm Lead','Needs Photos','B','Near Existing Customer','High Density'].includes(v)
  const red=['Red','Rejected','Do Not Contact','Cancelled','Failed','Locked','C','D','Capacity Warning','Payment Missing'].includes(v)
  return <span className={`ylBadge ${green?'green':yellow?'yellow':red?'red':'blue'}`}>{v||'—'}</span>
}
function Field({label,value,onChange,type='text',textarea=false,placeholder=''}){return <label className="ylField"><span>{label}</span>{textarea?<textarea value={value||''} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>:<input type={type} value={value??''} placeholder={placeholder} onChange={e=>onChange(type==='number'?Number(e.target.value):e.target.value)}/>}</label>}

function ensureGoogleMaps(key){
  if(typeof window==='undefined') return Promise.reject(new Error('Google Maps only runs in the browser.'))
  if(window.google?.maps?.places) return Promise.resolve(window.google)
  if(window.__yardLoopGoogleMapsPromise) return window.__yardLoopGoogleMapsPromise
  if(!key) return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in Vercel.'))
  window.__yardLoopGoogleMapsPromise = new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-yard-loop-google-maps="true"]')
    if(existing){existing.addEventListener('load',()=>resolve(window.google));existing.addEventListener('error',()=>reject(new Error('Google Maps script failed to load.')));return}
    const script=document.createElement('script')
    script.dataset.yardLoopGoogleMaps='true'
    script.async=true
    script.defer=true
    script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`
    script.onload=()=>window.google?.maps?resolve(window.google):reject(new Error('Google Maps loaded but did not initialize.'))
    script.onerror=()=>reject(new Error('Google Maps script failed to load.'))
    document.head.appendChild(script)
  })
  return window.__yardLoopGoogleMapsPromise
}
function googleAddressPart(place,type,useShort=false){
  const row=(place?.address_components||[]).find(c=>(c.types||[]).includes(type))
  return row ? (useShort ? row.short_name : row.long_name) : ''
}
function googlePlaceToDraft(place){
  const street=[googleAddressPart(place,'street_number'), googleAddressPart(place,'route')].filter(Boolean).join(' ')
  const city=googleAddressPart(place,'locality')||googleAddressPart(place,'postal_town')||googleAddressPart(place,'sublocality')||googleAddressPart(place,'administrative_area_level_2')
  const state=googleAddressPart(place,'administrative_area_level_1',true)
  const zip=googleAddressPart(place,'postal_code')
  const country=googleAddressPart(place,'country')||'United States'
  const loc=place?.geometry?.location
  const lat=loc?.lat ? loc.lat() : ''
  const lng=loc?.lng ? loc.lng() : ''
  return {
    address: street || place?.formatted_address || '', city, state, zip, country,
    formattedAddress: place?.formatted_address || [street, city, state, zip].filter(Boolean).join(', '),
    googlePlaceId: place?.place_id || '', latitude: lat, longitude: lng,
    locationVerifiedAt: new Date().toISOString(), locationSource:'Google Maps'
  }
}
function GoogleAddressInput({draft,setDraft,setMsg,settings}){
  const ref=useRef(null)
  const key=process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  useEffect(()=>{
    if(!key || !ref.current) return
    let listener=null
    ensureGoogleMaps(key).then(()=>{
      if(!window.google?.maps?.places || !ref.current) return
      const autocomplete=new window.google.maps.places.Autocomplete(ref.current,{types:['address'],componentRestrictions:{country:'us'},fields:['address_components','formatted_address','geometry','place_id','name']})
      listener=autocomplete.addListener('place_changed',()=>{
        const place=autocomplete.getPlace()
        const patch=googlePlaceToDraft(place)
        setDraft(d=>({...d,...patch}))
        const cityOk=!patch.city || !(settings?.serviceAreas||[]).length || (settings.serviceAreas||[]).some(a=>norm(a)===norm(patch.city))
        setMsg(cityOk?'✅ Google address verified and filled into the estimate.':'⚠️ Google address verified, but city may be outside the saved service-area list.')
      })
    }).catch(e=>setMsg('Google address autocomplete is not ready: '+e.message))
    return ()=>{try{listener?.remove?.()}catch{}}
  },[key,setDraft,setMsg,settings])
  return <label className="ylField"><span>Address — Google autocomplete</span><input ref={ref} value={draft.address||''} placeholder="Start typing customer address" onChange={e=>setDraft(d=>({...d,address:e.target.value,locationVerifiedAt:''}))}/>{!key&&<small className="ylGoogleWarn">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in Vercel to enable autocomplete.</small>}</label>
}
function GoogleMapPreview({draft}){
  const key=process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  const q=draft.latitude&&draft.longitude ? `${draft.latitude},${draft.longitude}` : (draft.formattedAddress || [draft.address,draft.city,draft.state,draft.zip].filter(Boolean).join(', '))
  if(!key || !q) return null
  const src=`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}`
  const open=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
  return <div className="ylGoogleMapBox"><iframe title="Google verified service address" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><div className="ylActions"><a className="ylSecondaryLink" href={open} target="_blank" rel="noreferrer">Open in Google Maps</a>{draft.locationVerifiedAt&&<span className="ylGoogleVerified">Verified {new Date(draft.locationVerifiedAt).toLocaleString()}</span>}</div></div>
}

function Pill({children,active,onClick,disabled=false}){return <button type="button" disabled={disabled} onClick={onClick} className={`ylPill ${active?'active':''}`}>{children}</button>}
function log(data,who,text){return {...data,activity:[{id:uid('act'),at:new Date().toISOString(),who:who?.name||'System',text},...(data.activity||[])].slice(0,1000)}}

const SECRET_INTEGRATION_KEYS = new Set(['clientId','clientSecret','redirectUrl','authorizationUrl','accessToken','refreshToken','webhookSecret','publishableKey','secretKey','mapsApiKey','analyticsMeasurementId','tagManagerId','oauthClientId','oauthClientSecret','resendApiKey','accountSid','authToken','companyId','priceIdMonthly','driveFolderId'])
function sanitizeForBrowserStorage(raw){
  const safe=clone(raw||{})
  const integrations=safe?.settings?.integrations
  if(integrations){
    Object.keys(integrations).forEach(provider=>{
      Object.keys(integrations[provider]||{}).forEach(key=>{
        if(SECRET_INTEGRATION_KEYS.has(key)) delete integrations[provider][key]
      })
    })
  }
  // V24: do not write bulky signature image blobs to browser/cloud JSON storage.
  // Signed contract PDFs are generated separately; typed signer names/metadata remain.
  ;['contracts','estimates'].forEach(collection=>{
    if(Array.isArray(safe[collection])){
      safe[collection] = safe[collection].map(row=>{
        const copy = {...row}
        delete copy.signatureImage
        if(copy.draft) copy.draft = {...copy.draft, signatureImage:''}
        return copy
      })
    }
  })
  return safe
}

function SigPad({value,onChange}){const ref=useRef(null);const drawing=useRef(false);useEffect(()=>{const c=ref.current;if(!c)return;const ctx=c.getContext('2d');ctx.lineWidth=3;ctx.lineCap='round';ctx.strokeStyle='#102033';if(value){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,c.width,c.height);img.src=value}},[value]);function pt(e){const r=ref.current.getBoundingClientRect();const t=e.touches?.[0]||e;return {x:(t.clientX-r.left)*(ref.current.width/r.width),y:(t.clientY-r.top)*(ref.current.height/r.height)}}function start(e){drawing.current=true;const p=pt(e);const ctx=ref.current.getContext('2d');ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault()}function move(e){if(!drawing.current)return;const p=pt(e);const ctx=ref.current.getContext('2d');ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault()}function end(){if(!drawing.current)return;drawing.current=false;onChange(ref.current.toDataURL('image/png'))}function clear(){const c=ref.current;c.getContext('2d').clearRect(0,0,c.width,c.height);onChange('')}return <div className="ylSig"><canvas ref={ref} width="620" height="170" onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end}/><button type="button" onClick={clear}>Clear Signature</button></div>}

export default function RepPortal(){
  const [data,setData]=useState(baseData)
  const [user,setUser]=useState(null)
  const [loginId,setLoginId]=useState('kevin')
  const [pin,setPin]=useState('')
  const [loginAttempts,setLoginAttempts]=useState(0)
  const [cloudPassword,setCloudPassword]=useState('')
  const [tab,setTab]=useState('dashboard')
  const [msg,setMsg]=useState('')
  const [draft,setDraft]=useState(blankDraft)
  const [newUser,setNewUser]=useState({name:'',username:'',role:'Sales Rep',email:'',phone:'',pin:''})
  const [leadDraft,setLeadDraft]=useState({name:'',address:'',phone:'',email:'',source:'Door knocking',assignedTo:'Kevin Kucks',status:'New',followUpDate:today(),notes:''})
  const [contractorDraft,setContractorDraft]=useState({name:'',service:'Lawn Mowing',phone:'',email:'',area:'Omaha',capacity:10,status:'Prospect',insurance:'Missing',w9:'Missing',agreement:'Missing',score:80,notes:''})
  const [jobDraft,setJobDraft]=useState({customerName:'',address:'',service:'Lawn Mowing',contractor:'',status:'Unassigned',due:today(),beforePhoto:'',afterPhoto:'',notes:''})
  const [prospectDraft,setProspectDraft]=useState({address:'',status:'New Prospect',repName:'',notes:''})
  const [task,setTask]=useState({text:'',assignedTo:'Kevin Kucks',due:today()})
  const [counterPriceInputs,setCounterPriceInputs]=useState({})
  const [smsComposer,setSmsComposer]=useState({open:false,target:null,to:'',message:'',consentConfirmed:false})
  const [pendingEstimateSubmit,setPendingEstimateSubmit]=useState(null)
  const [listSearch,setListSearch]=useState({leads:'',customers:'',jobs:'',contractors:''})
  const [listFilter,setListFilter]=useState({customers:'All',jobs:'All',leads:'All',contractors:'All'})
  const [selectedCustomerId,setSelectedCustomerId]=useState('')
  const [estimateWizardTab,setEstimateWizardTab]=useState('info')
  const [pendingRemove,setPendingRemove]=useState(null)
  const [ccModal,setCcModal]=useState(false)
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  const estimateTabs=['info','services','pay','agree','status']
  const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December']
  const monthLabel=(offset=0)=>monthNames[(new Date().getMonth()+offset)%12]
  const resetEstimateDraft=()=>{setDraft({...blankDraft,accountManager:user?.name||'',assignedTo:user?.name||'',serviceBeginDate:'',statusNotes:''});setEstimateWizardTab('info');setMsg('New customer estimate started.')}
  const saveStatusNotes=()=>{setDraft(d=>({...d,statusNotesConfirmedAt:new Date().toISOString()}));setMsg('Status notes confirmed and saved to this estimate.')}
  const saveTimer=useRef(null)

  const activeUsers=(data.users||[]).filter(u=>u.active)
  const canOwner=user?.fullAccess||['Owner','Manager'].includes(user?.role)
  const pageNav=[
    {id:'dashboard',label:'Dashboard'},
    {id:'neighborhood',label:'Neighborhood Page'},
    {id:'estimate',label:'Estimate Page'},
    {id:'approvals',label:'Approval Page'},
    {id:'leads',label:'Leads Page'},
    {id:'customers',label:'Customers Page'},
    {id:'jobs',label:'Jobs Page',ownerOnly:true},
    {id:'reports',label:'Reports Page',ownerOnly:true},
    {id:'documents',label:'Documents Page',ownerOnly:true},
    {id:'training',label:'Training Page'}
  ]
  const settingsNav=[
    {id:'contractors',label:'Contractors Page',ownerOnly:true},
    {id:'capacity',label:'Capacity Page',ownerOnly:true},
    {id:'pricing',label:'Pricing Page',ownerOnly:true},
    {id:'users',label:'Users Page',ownerOnly:true},
    {id:'integrations',label:'Integrations Page',ownerOnly:true},
    {id:'settings',label:'Settings Page',ownerOnly:true}
  ]
  const visiblePageNav=pageNav.filter(x=>canOwner||!x.ownerOnly)
  const visibleSettingsNav=settingsNav.filter(x=>canOwner||!x.ownerOnly)
  const tabs=[...visiblePageNav,...visibleSettingsNav].map(x=>x.id)
  const calc=useMemo(()=>calcEstimate(draft,data.settings),[draft,data.settings])

  useEffect(()=>{loadLocal()},[])
  useEffect(()=>{if(!cloudPassword||!user)return; const id=setInterval(()=>loadCloud(true),15000); return ()=>clearInterval(id)},[cloudPassword,user])

  function persist(next,note='Saved'){
    const merged=mergeData(next);setData(merged);try{localStorage.setItem(STORAGE,JSON.stringify(sanitizeForBrowserStorage(merged)))}catch{};saveCloudData(sanitizeForBrowserStorage(merged));setMsg(note);setTimeout(()=>setMsg(''),3200)
  }
  function loadLocal(){try{const local=localStorage.getItem(STORAGE);setData(mergeData(sanitizeForBrowserStorage(local?JSON.parse(local):baseData)))}catch{setData(mergeData(baseData))}}
  async function saveCloudData(next){if(!cloudPassword)return;clearTimeout(saveTimer.current);saveTimer.current=setTimeout(async()=>{try{const r=await fetch('/api/rep-data',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':cloudPassword},body:JSON.stringify(next)}); if(!r.ok){const j=await r.json().catch(()=>({})); setMsg('Cloud sync failed — '+(j.error||'check password/connection'))}}catch(e){setMsg('Cloud sync failed — check password/connection: '+e.message)}},500)}
  async function loadCloud(silent=false){if(!cloudPassword){if(!silent)setMsg('Enter Vercel ADMIN_PASSWORD as Cloud Sync Password.');return}try{const r=await fetch('/api/rep-data',{cache:'no-store',headers:{'x-admin-password':cloudPassword}});const j=await r.json().catch(()=>({}));if(!r.ok||j.error){if(!silent)setMsg('Cloud load blocked: '+(j.error||'unknown'));return}const merged=mergeData(sanitizeForBrowserStorage(j));setData(merged);localStorage.setItem(STORAGE,JSON.stringify(sanitizeForBrowserStorage(merged)));if(!silent)setMsg('✅ Shared cloud data loaded.')}catch(e){if(!silent)setMsg('Cloud load failed: '+e.message)}}
  async function saveCloud(){if(!cloudPassword){setMsg('Enter Cloud Sync Password first.');return}try{const r=await fetch('/api/rep-data',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':cloudPassword},body:JSON.stringify(sanitizeForBrowserStorage(data))});setMsg(r.ok?'✅ Shared cloud copy saved.':'Cloud save blocked — check password/connection')}catch(e){setMsg('Cloud save failed: '+e.message)}}
  function exportJson(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`yard-loop-crm-backup-${today()}.json`;a.click()}
  function importJson(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{persist(log(mergeData(JSON.parse(r.result)),user,'Imported CRM backup'),'Backup imported')}catch{setMsg('Import failed')}};r.readAsText(file)}

  function login(){
    if(loginAttempts>=5){setMsg('Too many failed PIN attempts. Refresh the page before trying again.');return}
    const u=activeUsers.find(x=>(x.id===loginId||x.username===loginId)&&x.pin===pin)
    if(!u){const next=loginAttempts+1;setLoginAttempts(next);setMsg(next>=5?'Too many failed PIN attempts. Refresh the page before trying again.':'Wrong username/PIN. Default owner PIN is 0000 until changed.');return}
    setLoginAttempts(0);setUser(u);setDraft(d=>({...d,accountManager:u.name,assignedTo:u.name}));setMsg(`Welcome ${u.name} • ${u.role}`);if(cloudPassword)setTimeout(()=>loadCloud(true),250)
  }
  function updateSettings(path,value){const next=clone(data);let o=next.settings;path.slice(0,-1).forEach(p=>{o[p]=o[p]||{};o=o[p]});o[path[path.length-1]]=value;persist(log(next,user,'Updated '+path.join('.')),'Setting updated')}
  
  function updateFrequencyConfig(serviceId,index,field,value){const s=data.settings.serviceConfig[serviceId];const freqs=normalizeFreqs(s.frequencies, serviceConfig[serviceId]?.frequencies);const row=[...(freqs[index]||['Annual',1,'',''])];if(field==='label')row[0]=value;if(field==='annual')row[1]=Number(value||0);if(field==='points')row[2]=value===''?'':Number(value||0);if(field==='cost')row[3]=value===''?'':Number(value||0);freqs[index]=row;updateSettings(['serviceConfig',serviceId],{...s,frequencies:freqs})}
  function addFrequencyConfig(serviceId){const s=data.settings.serviceConfig[serviceId];const freqs=normalizeFreqs(s.frequencies, serviceConfig[serviceId]?.frequencies);updateSettings(['serviceConfig',serviceId],{...s,frequencies:[...freqs,['New frequency',1,'','']]})}
  function removeFrequencyConfig(serviceId,index){const s=data.settings.serviceConfig[serviceId];const freqs=normalizeFreqs(s.frequencies, serviceConfig[serviceId]?.frequencies).filter((_,i)=>i!==index);updateSettings(['serviceConfig',serviceId],{...s,frequencies:freqs.length?freqs:[['Annual',1,'','']]})}
  function addCapacityForContractor(c){const svc=c.service;const area=c.area||'Omaha';const cap=Number(c.capacity||0);if(!svc||!area||cap<1)return data.settings.capacity||[];const id=`${area}-${svc}`;const row={id,area,service:svc,capacity:cap};return [row,...(data.settings.capacity||[]).filter(x=>x.id!==id)]}
  function updateUser(id,patch){const next={...data,users:data.users.map(u=>u.id===id?{...u,...patch,fullAccess:patch.role?patch.role==='Owner':u.fullAccess}:u)};persist(log(next,user,'Updated user'),'User updated')}
  function addUser(){if(!canOwner)return;if(!newUser.name){setMsg('Enter user name.');return}const u={...newUser,id:uid('user'),username:newUser.username||newUser.name.toLowerCase().split(' ')[0],active:true,fullAccess:newUser.role==='Owner'};persist(log({...data,users:[u,...data.users]},user,'Added user '+u.name),'User added')}
  function setSvc(id,key,value){setDraft(d=>({...d,serviceDetails:{...d.serviceDetails,[id]:{...(d.serviceDetails[id]||{}),[key]:value}}}))}
  function toggleService(id){const cfg=data.settings.serviceConfig[id]||serviceConfig[id];setDraft(d=>d.selectedServices.includes(id)?{...d,selectedServices:d.selectedServices.filter(x=>x!==id)}:{...d,selectedServices:[...d.selectedServices,id],serviceDetails:{...d.serviceDetails,[id]:{frequency:cfg.frequencies?.[0]?.[0]||'Annual',quick:services[id]?.quick?.[1]||'Standard',difficulty:'Normal'}}})}
  function startBundle(b){if(b.id==='customize'){setDraft({...draft,bundleId:b.id,selectedServices:[],serviceDetails:{}});return}const details={...draft.serviceDetails};b.services.forEach(id=>{const cfg=data.settings.serviceConfig[id]||serviceConfig[id];details[id]=details[id]||{frequency:cfg.frequencies?.[0]?.[0]||'Annual',quick:services[id]?.quick?.[1]||'Standard',difficulty:'Normal'}});setDraft({...draft,bundleId:b.id,selectedServices:[...new Set(b.services)],serviceDetails:details})}
  function addressRecord(address){const a=norm(address);if(!a)return null;return data.customers.find(c=>norm(c.address)===a)||data.leads.find(l=>norm(l.address)===a)||data.prospects.find(p=>norm(p.address)===a)||data.doorLogs.find(d=>norm(d.address)===a)}
  function addressStatus(address){const rec=addressRecord(address);if(!rec)return {status:'New Prospect',class:'green',message:'No Yard Loop history found.'};if(rec.dnc||rec.status==='Do Not Contact')return {status:'Do Not Contact',class:'red',message:'Do not knock or contact.'};if(rec.status==='Active')return {status:'Active Customer',class:'blue',message:'Do not create duplicate customer. Use upsell, service issue, or referral.'};if(rec.status==='Signed')return {status:'Signed / Pending Activation',class:'blue',message:'Contract already signed. Check payment and onboarding.'};if(rec.status==='Estimate Given')return {status:'Estimate Previously Given',class:'yellow',message:'Review previous estimate before proceeding.'};return {status:'Previously Contacted',class:'yellow',message:'Check notes/history before knocking again.'}}
  function densityFor(address=''){const street=address.split(' ').slice(1).join(' ').toLowerCase();if(!street)return {score:'New Area',count:0};const count=(data.customers||[]).filter(c=>c.address?.toLowerCase().includes(street)&&c.status==='Active').length;return {score:count>=3?'High Density':count>=1?'Near Existing Customer':'New Area',count}}
  function serviceCapacityWarning(){
    if(data.settings.capacityEnforcement==='off') return []
    const selected=draft.selectedServices||[];const city=draft.city||draft.address?.split(',').slice(-1)[0]||'';const warnings=[]
    selected.forEach(id=>{const svc=(data.settings.serviceConfig[id]?.label||id);
      const contractorMatches=(data.contractors||[]).filter(c=>c.status==='Approved'&&(c.service===svc||String(c.services||'').includes(svc))&&(!city||String(c.area||'').toLowerCase().includes(String(city).toLowerCase())||String(c.area||'').toLowerCase().includes('omaha')))
      const contractorCapacity=contractorMatches.reduce((a,c)=>a+Number(c.capacity||0),0)
      const adminCapacity=(data.settings.capacity||[]).filter(c=>(c.service===svc||c.service===id)&&(!city||String(c.area||'').toLowerCase().includes(String(city).toLowerCase())||String(c.area||'').toLowerCase().includes('omaha'))).reduce((a,c)=>a+Number(c.capacity||0),0)
      const capacity=contractorCapacity+adminCapacity
      if(capacity<1)warnings.push(`${svc}: no approved contractor or admin capacity found for this area`)
    });return warnings}
  function requestApproval(){if(!draft.name||!draft.address){setMsg('Name and address required before requesting approval.');return}const approval={id:uid('appr'),type:'Estimate',status:'Pending',createdAt:new Date().toISOString(),repId:user?.id,repName:user?.name,customerName:draft.name,address:draft.address,draft,calc,reason:calc.marginNeedsApproval?'Margin below floor':calc.discountNeedsApproval?'Discount above rep limit':'Owner review requested',capacityWarnings:serviceCapacityWarning()};persist(log({...data,approvals:[approval,...data.approvals]},user,`Approval requested for ${draft.name}`),'Approval request sent to owner dashboard');setTab('approvals')}
  function approveDeal(a,patch={}){const nextApproval={...a,status:patch.status||'Approved',ownerName:user?.name,ownerNote:patch.ownerNote||'',approvedAt:new Date().toISOString(),counterPrice:patch.counterPrice||''};let next={...data,approvals:data.approvals.map(x=>x.id===a.id?nextApproval:x)};persist(log(next,user,`${nextApproval.status}: ${a.customerName}`),'Approval updated')}
  function approveContractorFromApproval(a,status='Approved'){const c=a.contractor;const nextApproval={...a,status,ownerName:user?.name,approvedAt:new Date().toISOString()};let contractors=data.contractors.map(x=>x.id===a.contractorId?{...x,status}:x);let next={...data,approvals:data.approvals.map(x=>x.id===a.id?nextApproval:x),contractors};if(status==='Approved'&&c){next={...next,settings:{...next.settings,capacity:addCapacityForContractor({...c,status:'Approved'})}}}persist(log(next,user,`${status}: contractor ${a.customerName}`),'Contractor approval updated')}
  function applyApprovalToDraft(a){setDraft({...a.draft,ownerApproved:a.status==='Approved',ownerApprovalId:a.id,ownerApprovedPrice:a.counterPrice||a.draft.ownerApprovedPrice||''});setTab('estimate');setMsg(a.status==='Approved'?'Approval loaded. Deal unlocked.':'Approval loaded.')}
  async function savePhoto(files,target='draft'){for(const file of Array.from(files||[]).slice(0,4)){if(file.size>4*1024*1024){setMsg('Photo skipped: keep photos under 4 MB.');continue} if(!cloudPassword){setMsg('Photo upload needs Cloud Sync Password. Local preview only until cloud upload is configured.'); const r=new FileReader(); r.onload=()=>{if(target==='draft')setDraft(d=>({...d,photos:[...(d.photos||[]),{id:uid('photo'),name:file.name,dataUrl:r.result,size:file.size,localOnly:true}]}));}; r.readAsDataURL(file); continue} try{const fd=new FormData(); fd.append('file',file); const r=await fetch('/api/upload',{method:'POST',headers:{'x-admin-password':cloudPassword},body:fd}); const j=await r.json().catch(()=>({})); if(!r.ok||!j.url){setMsg('Photo upload failed: '+(j.error||'check Blob/password')); continue} if(target==='draft')setDraft(d=>({...d,photos:[...(d.photos||[]),{id:uid('photo'),name:file.name,url:j.url,size:file.size,uploadedAt:j.uploadedAt}]})); setMsg('Photo uploaded to cloud.')}catch(e){setMsg('Photo upload failed: '+e.message)}}}
  function addDoorLog(outcome='No Answer'){if(!draft.address){setMsg('Add/select address first.');return}const row={id:uid('door'),address:draft.address,repName:user?.name,outcome,status:outcome,createdAt:new Date().toISOString(),notes:draft.notes||''};persist(log({...data,doorLogs:[row,...data.doorLogs],prospects:[{id:uid('prop'),address:draft.address,status:outcome,repName:user?.name,lastContact:today(),notes:draft.notes||''},...data.prospects]},user,`Door log: ${draft.address} — ${outcome}`),'Door log saved')}
  function saveEstimate(status){
    if(!draft.name||!draft.address){setMsg('Name and address are required.');return}
    if(status==='Signed'){
      const missing=[]
      if(!String(draft.termsInitials||'').trim()) missing.push('terms/electronic notice initials')
      if(!String(draft.autopayInitials||'').trim()) missing.push('autopay authorization initials')
      if(!String(draft.signatureImage||'').startsWith('data:image/')) missing.push('customer signature')
      if(missing.length){setMsg('Cannot activate customer yet. Missing: '+missing.join(', ')+'.');return}
    }
    const addrStatus=addressStatus(draft.address)
    if(addrStatus.status==='Do Not Contact'){setMsg('Blocked: this address is Do Not Contact.');return}
    const currentCapacityWarnings=serviceCapacityWarning(); if(status==='Signed'&&data.settings.capacityEnforcement==='strict'&&currentCapacityWarnings.length){setMsg('Capacity locked: owner must add approved contractor capacity or switch Capacity Enforcement to Warning Only/Test Mode.');return}
    const paymentReady=['ACH enrolled','Card on file','Manual invoice approved'].includes(draft.paymentStatus)
    if(status==='Estimate Submitted'&&data.settings.requiredPaymentBeforeActive&&!paymentReady&&!pendingEstimateSubmit){
      setPendingEstimateSubmit(status)
      setMsg('Payment method warning: review the yellow warning in the estimator and choose Continue Without Payment or Cancel.')
      return
    }
    if(pendingEstimateSubmit===status) setPendingEstimateSubmit(null)
    if(status==='Signed'&&calc.closeLocked){setMsg('Locked: owner approval required before closing this deal.');return}
    if(status==='Signed'&&data.settings.requiredPaymentBeforeActive&&!paymentReady){setMsg('Payment/ACH/Card must be completed or owner-approved before activation.');return}
    const route=densityFor(draft.address)
    const estimate={id:uid('est'),customerId:'',repId:user?.id,repName:user?.name,assignedTo:draft.assignedTo,status,createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+Number(data.settings.estimateExpirationDays||14)*86400000).toISOString().slice(0,10),draft:{...draft,termsAccepted:!!draft.termsInitials,autopayAccepted:!!draft.autopayInitials},calc,ownerApprovalId:draft.ownerApprovalId||''}
    const lead={id:uid('lead'),estimateId:estimate.id,name:draft.name,address:draft.address,phone:draft.phone,email:draft.email,repName:user?.name,assignedTo:draft.assignedTo,status:status==='Signed'?'Converted to Customer':status,source:draft.leadSource||'CRM Estimate',createdAt:today(),followUpDate:status==='Follow Up'?today():'',monthly:calc.monthly,agreementGeneratedAt:draft.agreementGeneratedAt||new Date().toISOString(),selectedServices:draft.selectedServices,notes:draft.notes||draft.permanentNotes||''}
    let next={...data,estimates:[estimate,...data.estimates],leads:[lead,...data.leads]}
    let customer=null
    let signedContract=null
    if(status==='Estimate Submitted'&&calc.closeLocked){const approval={id:uid('appr'),type:'Estimate',status:'Pending',createdAt:new Date().toISOString(),repId:user?.id,repName:user?.name,customerName:draft.name,address:draft.address,draft:{...draft},calc,reason:calc.marginNeedsApproval?'Submitted below margin floor':calc.discountNeedsApproval?'Submitted above rep discount limit':'Submitted for owner review',capacityWarnings:serviceCapacityWarning(),estimateId:estimate.id};next={...next,approvals:[approval,...next.approvals]}}
    if(status==='Signed'){
      const existing=data.customers.find(c=>norm(c.address)===norm(draft.address))
      customer={...(existing||{id:uid('cust'),createdAt:new Date().toISOString()}),name:draft.name,address:draft.address,phone:draft.phone,email:draft.email,city:draft.city,accountManager:draft.accountManager||user?.name,assignedTo:draft.assignedTo||user?.name,status:(draft.serviceBeginDate?'Scheduled - Not Active':'Signed - Needs Start Date'),health:calc.marginStatus==='Red'?'Review Profit':'Good',routeScore:route.score,selectedServices:draft.selectedServices,measurements:draft.serviceDetails,billingStatus:draft.paymentStatus,paymentStatus:draft.paymentStatus,achAuthorized:true,notes:draft.notes,photos:draft.photos||[],monthly:calc.monthly,annual:calc.annual,margin:calc.margin,dealGrade:calc.dealGrade,renewalDate:new Date(Date.now()+365*86400000).toISOString().slice(0,10),checkoutToken:existing?.checkoutToken||(globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : uid('checkout')),checkoutTokenExpiresAt:new Date(Date.now()+30*86400000).toISOString(),updatedAt:new Date().toISOString()}
      estimate.customerId=customer.id
      signedContract={id:uid('con'),customerId:customer.id,customerName:draft.name,address:draft.address,email:draft.email,phone:draft.phone,monthly:calc.monthly,annual:calc.annual,services:draft.selectedServices,serviceLabels:(draft.selectedServices||[]).map(id=>data.settings.serviceConfig[id]?.label||id),signatureName:draft.name,signatureImage:draft.signatureImage,status:'Signed',signedAt:new Date().toISOString(),checkoutToken:customer.checkoutToken,checkoutTokenExpiresAt:customer.checkoutTokenExpiresAt}
      const jobs=(draft.selectedServices||[]).map(id=>({id:uid('job'),customerId:customer.id,customerName:draft.name,address:draft.address,service:data.settings.serviceConfig[id]?.label||id,serviceId:id,status:(draft.serviceBeginDate?'Scheduled':'Pending Start Date'),due:(draft.serviceBeginDate||nextDueForService(id,data.settings.serviceConfig[id]?.label)),contractor:'',needsBeforePhoto:true,needsAfterPhoto:true,beforePhotos:[],afterPhotos:[],notes:draft.notes||'',createdAt:new Date().toISOString()}))
      next={...next,customers:[customer,...data.customers.filter(c=>c.id!==customer.id)],contracts:[signedContract,...next.contracts],jobs:[...jobs,...next.jobs]}
    }
    persist(log(next,user,`${status}: ${draft.name} — ${money(calc.monthly)}/mo, ${pct(calc.margin)} margin, ${route.score}`),`✅ ${status} saved`)
    if(status==='Estimate Submitted') sendEstimateEmail(lead, estimate)
    if(status==='Signed'&&customer) { setDraft(d=>({...d,signedAgreementLocked:true,signedAgreementSnapshotAt:new Date().toISOString()})); setEstimateWizardTab('agree'); syncSignedContract(customer, estimate); generateContractAndWelcome(customer, estimate, signedContract); setMsg('Signed agreement saved. Customer and jobs were created as Scheduled / Pending Start, not Active, until service start is confirmed.') }
  }

  function addLead(){if(!leadDraft.name&&!leadDraft.address){setMsg('Enter at least a name or address.');return}const lead={id:uid('lead'),createdAt:new Date().toISOString(),...leadDraft,repName:user?.name};persist(log({...data,leads:[lead,...data.leads]},user,'Added lead'),'Lead added')}
  function removeLead(id){const target=(data.leads||[]).find(l=>l.id===id); if(!target)return; persist(log({...data,leads:(data.leads||[]).filter(l=>l.id!==id)},user,'Removed lead '+(target.name||target.address||id)),'Lead removed'); setPendingRemove(null)}
  function addContractor(statusOverride=''){if(!canOwner)return;if(!contractorDraft.name){setMsg('Contractor name required.');return}const row={id:uid('ctr'),createdAt:new Date().toISOString(),...contractorDraft,status:statusOverride||contractorDraft.status};let next={...data,contractors:[row,...data.contractors]};if(row.status==='Approved'){next={...next,settings:{...next.settings,capacity:addCapacityForContractor(row)}}}else{const approval={id:uid('appr'),type:'Contractor',status:'Pending',createdAt:new Date().toISOString(),contractorId:row.id,contractor:row,customerName:row.name,address:row.area,reason:'Contractor approval needed'};next={...next,approvals:[approval,...next.approvals]}}persist(log(next,user,'Added contractor '+row.name),'Contractor added')}
  function updateContractor(id,patch){let updated=null;const contractors=data.contractors.map(c=>{if(c.id===id){updated={...c,...patch};return updated}return c});let next={...data,contractors};if(updated?.status==='Approved'){next={...next,settings:{...next.settings,capacity:addCapacityForContractor(updated)}}}persist(log(next,user,'Updated contractor '+(updated?.name||'')),'Contractor updated')}
  function addJob(){if(!canOwner)return;if(!jobDraft.customerName&&!jobDraft.address){setMsg('Customer or address required.');return}persist(log({...data,jobs:[{id:uid('job'),createdAt:new Date().toISOString(),...jobDraft},...data.jobs]},user,'Added job'),'Job added')}
  function updateJob(id,patch){persist(log({...data,jobs:data.jobs.map(j=>j.id===id?{...j,...patch,updatedAt:new Date().toISOString()}:j)},user,'Updated job'),'Job updated')}
  function addProspect(){if(!prospectDraft.address){setMsg('Address required.');return}persist(log({...data,prospects:[{id:uid('prop'),lastContact:today(),repName:user?.name,...prospectDraft},...data.prospects]},user,'Added neighborhood prospect'),'Prospect added')}
  function addTask(){if(!task.text)return;persist(log({...data,tasks:[{id:uid('task'),status:'Open',createdAt:new Date().toISOString(),...task},...data.tasks]},user,'Added task'),'Task added')}
  function saveCapacity(area,service,capacity){const id=`${area}-${service}`;const row={id,area,service,capacity:Number(capacity||0)};persist(log({...data,settings:{...data.settings,capacity:[row,...(data.settings.capacity||[]).filter(x=>x.id!==id)]}},user,'Updated capacity'),'Capacity updated')}
  function seedTestCapacity(){const rows=[];data.settings.serviceAreas.forEach(area=>Object.values(data.settings.serviceConfig).filter(s=>s.enabled!==false&&!s.hidden).forEach(s=>rows.push({id:`${area}-${s.label}`,area,service:s.label,capacity:10})));persist(log({...data,settings:{...data.settings,capacity:rows}},user,'Loaded starter test capacity'),'Starter capacity loaded for testing')}


  function removeCustomer(id){
    const target=(data.customers||[]).find(c=>c.id===id)
    if(!target)return
    const next={...data,customers:data.customers.filter(c=>c.id!==id),jobs:data.jobs.filter(j=>j.customerId!==id),contracts:data.contracts.filter(c=>c.customerId!==id)}
    persist(log(next,user,'Removed customer '+(target.name||target.address||id)),'Customer removed')
    setPendingRemove(null); if(selectedCustomerId===id)setSelectedCustomerId('')
  }
  function removeContractor(id){
    const target=(data.contractors||[]).find(c=>c.id===id)
    if(!target)return
    persist(log({...data,contractors:data.contractors.filter(c=>c.id!==id)},user,'Removed contractor '+(target.name||id)),'Contractor removed')
    setPendingRemove(null)
  }
  async function verifyCurrentLocation(){
    if(!googleMapsKey){
      if(!navigator.geolocation){setMsg('Google Maps key and browser location are not available. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in Vercel.');return}
      setMsg('Google Maps key is missing. Capturing GPS only…')
      navigator.geolocation.getCurrentPosition(pos=>{
        const coords=`GPS ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
        setDraft(d=>({...d,address:d.address||coords,latitude:pos.coords.latitude,longitude:pos.coords.longitude,locationSource:'Browser GPS only',locationVerifiedAt:new Date().toISOString(),permanentNotes:[d.permanentNotes,coords].filter(Boolean).join(' | ')}))
        setMsg('GPS captured. Add Google Maps API key in Vercel for automatic address lookup.')
      },err=>setMsg('Location not captured: '+err.message),{enableHighAccuracy:true,timeout:9000})
      return
    }
    setMsg('Verifying address with Google Maps…')
    try{
      await ensureGoogleMaps(googleMapsKey)
      const geocoder=new window.google.maps.Geocoder()
      const typed=[draft.address,draft.city,draft.state,draft.zip].filter(Boolean).join(', ')
      const applyPlace=(place,msg)=>{
        const patch=googlePlaceToDraft(place)
        setDraft(d=>({...d,...patch}))
        const cityOk=!patch.city || !(data.settings.serviceAreas||[]).length || (data.settings.serviceAreas||[]).some(a=>norm(a)===norm(patch.city))
        setMsg(cityOk?msg:'⚠️ Address verified by Google, but city may be outside Yard Loop service areas.')
      }
      if(typed.trim()){
        geocoder.geocode({address:typed,componentRestrictions:{country:'US'}},(results,status)=>{
          if(status==='OK'&&results?.[0]) applyPlace(results[0],'✅ Address verified and filled from Google Maps.')
          else setMsg('Google could not verify that typed address. Try selecting from autocomplete or use current location.')
        })
        return
      }
      if(!navigator.geolocation){setMsg('Type an address or allow browser location to verify.');return}
      setMsg('Getting current location and reverse-geocoding with Google Maps…')
      navigator.geolocation.getCurrentPosition(pos=>{
        const location={lat:pos.coords.latitude,lng:pos.coords.longitude}
        geocoder.geocode({location},(results,status)=>{
          if(status==='OK'&&results?.[0]) applyPlace(results[0],'✅ Current location verified and address filled from Google Maps.')
          else {
            const coords=`GPS ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
            setDraft(d=>({...d,address:d.address||coords,latitude:location.lat,longitude:location.lng,locationSource:'Browser GPS only',locationVerifiedAt:new Date().toISOString(),permanentNotes:[d.permanentNotes,coords].filter(Boolean).join(' | ')}))
            setMsg('GPS captured, but Google could not find a street address for that location.')
          }
        })
      },err=>setMsg('Location not captured: '+err.message),{enableHighAccuracy:true,timeout:9000})
    }catch(e){setMsg('Google Maps verification failed: '+e.message)}
  }
  const mrr=data.customers.filter(c=>c.status==='Active').reduce((a,c)=>a+Number(c.monthly||0),0)
  const pendingApprovals=data.approvals.filter(a=>a.status==='Pending')
  const paymentMissing=data.customers.filter(c=>c.status==='Active'&&!['ACH enrolled','Card on file','Manual invoice approved'].includes(c.paymentStatus||''))
  const photoMissing=data.jobs.filter(j=>j.status==='Completed'&&(!j.beforePhoto||!j.afterPhoto))
  const jobberIssues=[...(data.customers||[]),...(data.leads||[]),...(data.jobs||[])].filter(r=>r.jobberSyncStatus==='Failed')
  const renewalsDue=(data.customers||[]).filter(c=>c.status==='Active'&&daysUntil(c.renewalDate)<=30)
  const filteredLeads=(data.leads||[]).filter(l=>matchesSearch(l,listSearch.leads)&&(['All',''].includes(listFilter.leads)||l.status===listFilter.leads||l.source===listFilter.leads))
  const filteredCustomers=(data.customers||[]).filter(c=>matchesSearch(c,listSearch.customers)&&(['All',''].includes(listFilter.customers)||c.status===listFilter.customers||c.city===listFilter.customers))
  const filteredJobs=(data.jobs||[]).filter(j=>matchesSearch(j,listSearch.jobs)&&(['All',''].includes(listFilter.jobs)||j.status===listFilter.jobs||j.service===listFilter.jobs))
  const contractorScore=(contractor={})=>{const jobs=(data.jobs||[]).filter(j=>norm(j.contractor)===norm(contractor.name)); if(!jobs.length)return Number(contractor.score||80); const completed=jobs.filter(j=>j.status==='Completed').length; const photoOk=jobs.filter(j=>j.beforePhoto&&j.afterPhoto).length; const complaints=jobs.filter(j=>/complaint|callback|redo/i.test(j.notes||'')).length; return Math.max(0,Math.min(100,Math.round(70+(completed/jobs.length)*15+(photoOk/jobs.length)*15-complaints*10)))}
  const filteredContractors=(data.contractors||[]).filter(c=>matchesSearch(c,listSearch.contractors)&&(['All',''].includes(listFilter.contractors)||c.status===listFilter.contractors||c.service===listFilter.contractors||c.area===listFilter.contractors))
  const selectedCustomer=(data.customers||[]).find(c=>c.id===selectedCustomerId)
  const avgMargin=data.estimates.length?data.estimates.reduce((a,e)=>a+Number(e.calc?.margin||0),0)/data.estimates.length:0
  const addr=addressStatus(draft.address)
  const capacityWarnings=serviceCapacityWarning()


  const oneTimeServices=['Fence Installation','Fence Repair','Plant Potting','Tree Removal','Stump Removal','Gutter Protection','Sprinkler Start Up','Driveway Sealing']
  const serviceFieldMap={
    mowing:[['frequency','Frequency','select',['26 mowings / year','Weekly','Twice weekly','Every 10 days']],['acres','Yard size - acreage','number'],['difficulty','Property difficulty','select',['Easy / Normal','Difficult','Very Difficult']]],
    gutters:[['frequency','Frequency','select',['2x/year','Quarterly','Every two years']],['gutterLength','Home gutter length in feet','number'],['downspouts','Number of downspouts','number'],['difficulty','Gutter difficulty','select',['Easy / Normal','Difficult','Very Difficult']]],
    windows:[['frequency','Frequency','select',['1x/year','2x/year','4x/year']],['paneCount','Pane count','number']],
    housewash:[['frequency','Frequency','select',['1x/year','2x/year','Every two years']],['exteriorSqFt','Estimated exterior wall square footage','number']],
    concrete:[['frequency','Frequency','select',['1x/year','2x/year','Every two years']],['squareFeet','Square footage','number']],
    deck:[['frequency','Frequency','select',['1x/year','2x/year','Every two years']],['squareFeet','Estimated square footage','number']],
    mulch:[['frequency','Frequency','select',['1x/year','Spring + fall','Every other year']],['bedSqFt','Estimated mulch bed square footage','number'],['mulchColor','Mulch color','select',['Natural brown','Black','Red','Cedar','Customer choice']],['bedNotes','Mulch bed notes','textarea'],['edging','Include mulch bed edging','checkbox'],['edgingFrequency','Edging frequency','select',['One time','1x/year','Spring + fall']],['edgingLinearFt','Estimated edging linear footage','number']],
    sprinkler:[['frequency','Frequency','select',['Annual']],['zones','Number of zones','number']],
    dogpoop:[['frequency','Frequency','select',['Biweekly','Weekly','Twice weekly','Monthly','Every three months','Every other week']],['yardSqFt','Dog cleanup yard square footage','number']],
    holiday:[['serviceNeeded','Service needed','select',['Seasonal install + removal','Install only','Removal only']],['lights','Lights','select',['Customer owned lights','Yard Loop owned lights']],['rooflineFt','Estimated roofline linear footage','number']],
    shrubs:[['frequency','Frequency','select',['Weekly','Biweekly','Monthly','Quarterly','1x/year','2x/year']],['smallShrubs','Small shrubs ($15 each)','number'],['mediumShrubs','Medium shrubs ($25 each)','number'],['largeShrubs','Large shrubs ($45 each)','number'],['weeding','Include weeding','checkbox'],['weedingFrequency','Weeding frequency','select',['Every two weeks','Monthly','Bi-monthly','One time']],['weedingBeds','Number of weeding beds','number']],
    leaves:[['package','Package','select',['Two-time pickup - contractor chooses best timing','Three-time pickup - contractor chooses best timing']],['yardSize','Yard size','select',['Small yard','Normal yard','Large yard']],['treeCount','Exact number of trees','number']],
    snow:[['frequency','Frequency','select',['Each snowfall']],['drivewaySize','Driveway / walkway size','select',['Small','Normal','Large']],['iceMelt','Ice melt add-on','select',['Ice melt add-on not needed','Include ice melt add-on +$10/month']]],
    fert:[['frequency','Frequency','select',['4–6 visits / year: early spring, late spring weed/feed, summer, fall, winterizer']],['yardSize','Yard size','select',['Small (under 5,000 sq ft)','Medium (5,000–10,000 sq ft)','Large (10,000–15,000 sq ft)']]],
    aeration:[['frequency','Frequency','select',['Once per year','Twice per year']],['yardSize','Yard size','select',['Small (under 5,000 sq ft)','Medium (5,000–10,000 sq ft)','Large (10,000–15,000 sq ft)']]],
    overseeding:[['frequency','Frequency','select',['1x/year','Spring + fall']],['yardSize','Yard size','select',['Small (under 5,000 sq ft)','Medium (5,000–10,000 sq ft)','Large (10,000–15,000 sq ft)']]],
    bins:[['frequency','Frequency','select',['Monthly','Every two months','Quarterly']],['binCount','Number of bins','number']],
    roofwash:[['frequency','Frequency','select',['One time','1x/year']],['roofSqFt','Estimated roof square footage','number']]
  }
  function DetailField({id,row}){const [key,label,type,options]=row;const detail=draft.serviceDetails[id]||{};if(type==='textarea')return <Field label={label} textarea value={detail[key]||''} onChange={v=>setSvc(id,key,v)}/>; if(type==='checkbox')return <label className="ylCheck"><input type="checkbox" checked={!!detail[key]} onChange={e=>setSvc(id,key,e.target.checked)}/>{label}</label>; if(type==='select')return <label className="ylField"><span>{label}</span><select value={detail[key]||options[0]} onChange={e=>setSvc(id,key,e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>; return <Field label={label} type={type} value={detail[key]||''} onChange={v=>setSvc(id,key,v)}/>}
  function renderAgreementSnapshot(){
    const serviceNames=(draft.selectedServices||[]).map(id=>data.settings.serviceConfig[id]?.label||services[id]?.label||id)
    return <div className="ylAgreementBox ylAgreementLocked"><h2>Signed Service Agreement Copy</h2><p className="ylHint">This copy is view-only. To change the agreement, start a new estimate or create an upsell/change order.</p><p><b>Yard Loop</b><br/>402-235-6168 • {data.settings.companyEmail||'info@yard-loop.com'}</p><h3>Service Address</h3><p>{draft.name}<br/>{draft.address}<br/>{draft.city} {draft.state||''} {draft.zip||''}</p><h3>All Services Included</h3><ul>{serviceNames.map(s=><li key={s}>{s}</li>)}</ul><h3>Monthly Total</h3><p><b>{money(calc.monthly)}</b> per month for {draft.contractLength||12} months.</p><h3>Customer Authorizations</h3><p className="ylFinePrint">Terms initials: {draft.termsInitials||'—'} • Autopay initials: {draft.autopayInitials||'—'} • Signed on {today()}</p>{draft.signatureImage&&<img className="ylSignatureImage" src={draft.signatureImage} alt="Customer signature"/>}</div>
  }
  function renderAgreementPreview(){
    const serviceNames=(draft.selectedServices||[]).map(id=>data.settings.serviceConfig[id]?.label||services[id]?.label||id)
    return <div className="ylAgreementBox"><h2>Service Agreement</h2><p><b>Yard Loop</b><br/>402-235-6168 • {data.settings.companyEmail||'info@yard-loop.com'}</p><h3>Service Address</h3><p>{draft.name}<br/>{draft.address}<br/>{draft.city} {draft.state||''} {draft.zip||''}</p><h3>Customer Information</h3><p>{draft.email} • {draft.phone}<br/>{draft.permanentNotes||draft.notes}</p><h3>All Services Included</h3><ul>{serviceNames.map(s=><li key={s}>{s}</li>)}</ul><h3>Payment Schedule</h3><div className="ylPayCalendar">{Array.from({length:Number(draft.contractLength||12)},(_,i)=><span key={i}>{monthLabel(i)}<b>{money(calc.monthly)}</b></span>)}</div><h3>Service / Warranty</h3><div className="ylStackedMoney"><p><b>Initial quote:</b> {money(calc.preDiscount)} monthly price for selected services.</p><p><b>Discount:</b> {draft.discountPct||0}% discount given for monthly bill.</p><p><b>Subtotal:</b> {money(calc.monthly)} total monthly bill with discount reduction.</p><p><b>Tax (0%):</b> $0.00</p><p><b>Monthly total:</b> {money(calc.monthly)}</p></div><p><b>Customer authorizes Yard Loop to securely collect and store a payment method at signing. For recurring monthly plans, Yard Loop may delay the first monthly charge until after the first scheduled service is completed or activated, then charge the same monthly amount on the recurring billing date for the contract length. Contractors will provide work for each service at appropriate times of year for each coordinating service.</b></p><h3>Agreement</h3><div className="ylFinePrint"><p><b>Terms of Service.</b> By enrolling in Yard Loop services, using our website, submitting a quote request, approving an estimate, or authorizing recurring billing, Customer agrees to these Terms of Service. Yard Loop provides recurring exterior home maintenance coordination services, including lawn mowing, gutter cleaning, exterior window cleaning, mulching, pressure washing, outdoor insect control, fertilizer/weed control, shrub trimming, aeration, sprinkler blowouts, and related exterior maintenance. Services may be performed by Yard Loop employees, subcontractors, or third-party service providers selected by Yard Loop. Services are scheduled based on seasonality, weather, contractor availability, property conditions, route density, safety, and operational requirements.</p><p><b>Cancellation Policy.</b> Customers may cancel recurring services with at least 30 days written notice by email, written communication, customer portal, or approved online cancellation form. Yard Loop will not require customers to cancel through a method that is unreasonably harder than the method used to enroll. Services and billing may continue during the 30-day notice period. Completed services, dispatched visits, prepaid seasonal services, material purchases, custom work, deposits, and administrative setup fees may be non-refundable.</p><p><b>Weather, Scheduling & Access.</b> Service dates are estimated and not guaranteed. Yard Loop may reschedule, delay, combine, or modify visits due to weather, storms, excessive heat, safety conditions, equipment failure, labor shortages, holidays, route optimization, or operational needs. Weather-related delays do not constitute breach of service. Customer must provide safe and reasonable property access, including unlocked gates, secured animals, clear work areas, and disclosure of hazards.</p><p><b>Damage Claims & Liability Limits.</b> Any claim for property damage must be submitted in writing within 7 calendar days of service. Failure to notify Yard Loop within 7 days may waive the claim. Yard Loop is not responsible for pre-existing damage, normal wear and tear, hidden hazards, improperly marked obstacles, irrigation systems, buried utilities, discoloration, weather-related lawn stress, or pre-existing surface conditions. To the fullest extent permitted by law, Yard Loop total liability shall not exceed the amount paid by Customer during the previous three months of service.</p><p><b>Snow & Ice Service Terms.</b> Snow and ice services are weather-dependent and may vary by storm, route conditions, road safety, accumulation, access, parked vehicles, and contractor availability. Unless a customer plan states otherwise, standard snow service generally begins around a 2-inch accumulation trigger and focuses on driveway, front walk, and primary entry access. Exact arrival times are not guaranteed. Heavy, continuing, drifting, or extreme storms may require multiple passes, delayed routes, return visits, or supplemental charges. Ice melt or deicing service is only included when authorized or selected in the customer plan. Yard Loop cannot guarantee that all ice will be eliminated, and customers remain responsible for safe use of their property during winter conditions.</p><p><b>Privacy Policy.</b> Yard Loop may collect customer name, address, phone, email, payment details, property information, service preferences, website activity, and communications. Information may be used to schedule services, process payments, improve operations, communicate with customers, provide support, send service or marketing messages, and improve website performance. Information may be shared with subcontractors, payment processors, scheduling providers, and operational partners as needed to perform services. Yard Loop does not sell personal customer information to third-party marketers.</p></div><h3>Billing Info</h3><p>{draft.billingName||draft.name}<br/>{draft.billingAddress||draft.address}<br/>{draft.billingCity||draft.city} {draft.billingState||draft.state} {draft.billingZip||draft.zip}</p><h3>Payment Info</h3><p>I authorize Yard Loop to automatically bill my selected payment method for selected services each month. Secure card/ACH collection is handled by Stripe/Jobber; full card or bank numbers are not stored in this CRM.</p><div className="ylFinePrint"><p><b>1. Services and Fees.</b> Customer agrees to pay all recurring monthly charges, authorized one-time services, approved add-ons, materials, service fees, and applicable charges listed in the selected Yard Loop plan or later-approved written change order. Monthly billing may spread seasonal services across the agreement term even when the exact service visit does not occur every month.</p><p><b>2. Termination Agreement.</b> Yard Loop may suspend or terminate service for nonpayment, unsafe property conditions, repeated access issues, abusive conduct, fraud, or material breach. Customer remains responsible for completed work, dispatched service, approved materials, and unpaid balances through the effective termination date.</p><p><b>3. Limitation of Liability.</b> To the fullest extent permitted by law, Yard Loop shall not be liable for indirect, incidental, consequential, special, punitive, or loss-of-use damages. Yard Loop total liability is limited to the amount paid by Customer during the previous three months of service.</p><p><b>4. Waiver of Jury Trial.</b> To the extent permitted by law, Customer and Yard Loop knowingly waive the right to a jury trial for disputes arising from this agreement, services, billing, property access, or related communications.</p><p><b>5. Buyer’s Right to Cancel.</b> If any state or federal cancellation right applies to this transaction, Yard Loop will honor that right. Nothing in this agreement limits any non-waivable consumer cancellation right provided by applicable law.</p><p><b>6. Severability; Entire Agreement; Counterparts.</b> If any part of this agreement is found unenforceable, the remaining terms remain in effect. This agreement and approved written updates represent the entire agreement between Customer and Yard Loop and may be accepted electronically, by signature, or in counterparts.</p></div><p><b>This agreement is for an initial period of {draft.contractLength||12} months.</b></p><div className="ylFinePrint"><p>I have read and agree to the terms and conditions of this agreement including any additional terms and disclosures listed above. I confirm that my email address is entered correctly and agree to receive my agreement, additional disclosures, and future account notifications electronically.</p></div><Field label="Please initial" value={draft.termsInitials||''} onChange={v=>setDraft({...draft,termsInitials:v,termsAccepted:!!v})}/><div className="ylFinePrint"><p>I authorize Yard Loop, together with its affiliates, designees, and other service providers, to electronically debit or charge my payment method for the applicable amount as services are provided. I agree that no prior notification may be provided. I understand that this preauthorized electronic transfer is to remain in effect until I contact Yard Loop and remove my authorization.</p></div><Field label="Please initial" value={draft.autopayInitials||''} onChange={v=>setDraft({...draft,autopayInitials:v,autopayAccepted:!!v})}/><SigPad value={draft.signatureImage} onChange={v=>setDraft({...draft,signatureImage:v})}/></div>
  }

  function renderEstimateWizard(){
    const tabs=['info','services','pay','agree','status']
    const visibleServices=Object.keys(data.settings.serviceConfig||{}).filter(id=>id!=='custom')
    return <section><h1>Estimate Builder</h1><div className={`ylBanner ${addr.class}`}>{addr.status}: {addr.message}</div><div className="ylWizardTabs">{tabs.map(t=><button key={t} className={estimateWizardTab===t?'active':''} onClick={()=>setEstimateWizardTab(t)}>{t==='info'?'Info':t==='services'?'Services':t==='pay'?'Pay':t==='agree'?'Agree':'Status'}</button>)}</div>
      {estimateWizardTab==='info'&&<section className="ylCard"><div className="ylActions"><button className="ylPrimary" onClick={resetEstimateDraft}>New Customer</button></div><h2>Info</h2><div className="ylGrid two"><section><h3>Customer Info</h3><Field label="First name" value={draft.firstName||''} onChange={v=>setDraft({...draft,firstName:v,name:[v,draft.lastName].filter(Boolean).join(' ')})}/><Field label="Last name" value={draft.lastName||''} onChange={v=>setDraft({...draft,lastName:v,name:[draft.firstName,v].filter(Boolean).join(' ')})}/><Field label="Phone number" value={draft.phone} onChange={v=>setDraft({...draft,phone:v})}/><Field label="Email" value={draft.email} onChange={v=>setDraft({...draft,email:v})}/></section><section><h3>Service Address</h3><div className="ylGoogleActions"><button className="ylPrimary" onClick={verifyCurrentLocation}>Verify Location</button>{draft.locationVerifiedAt&&<Badge value="Verified"/>}</div><GoogleAddressInput draft={draft} setDraft={setDraft} setMsg={setMsg} settings={data.settings}/><Field label="City" value={draft.city||''} onChange={v=>setDraft({...draft,city:v,locationVerifiedAt:''})}/><Field label="State" value={draft.state||''} onChange={v=>setDraft({...draft,state:v,locationVerifiedAt:''})}/><Field label="Country" value={draft.country||'USA'} onChange={v=>setDraft({...draft,country:v,locationVerifiedAt:''})}/><Field label="ZIP Code" value={draft.zip||''} onChange={v=>setDraft({...draft,zip:v,locationVerifiedAt:''})}/><GoogleMapPreview draft={draft}/></section></div><Field label="Permanent customer notes" textarea value={draft.permanentNotes||''} onChange={v=>setDraft({...draft,permanentNotes:v,notes:v})}/></section>}
      {estimateWizardTab==='services'&&<section><section className="ylCard"><h2>Services</h2><div className="ylGrid two"><label className="ylField"><span>Property Size</span><select value={draft.propertyTier} onChange={e=>setDraft({...draft,propertyTier:e.target.value})}><option value="small">Small Property</option><option value="medium">Standard Property</option><option value="large">Large Property</option><option value="estate">Estate Property</option></select></label><label className="ylField"><span>Home story amount</span><select value={draft.homeStories||'2'} onChange={e=>setDraft({...draft,homeStories:e.target.value,homeType:e.target.value+' Story'})}><option>1</option><option>2</option><option>3</option></select></label><label className="ylField"><span>Package</span><select value={draft.bundleId} onChange={e=>{const b=data.settings.bundles.find(x=>x.id===e.target.value); b?startBundle(b):setDraft({...draft,bundleId:e.target.value})}}>{data.settings.bundles.filter(b=>b.enabled).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label className="ylField"><span>Contract Length</span><select value={draft.contractLength||12} onChange={e=>setDraft({...draft,contractLength:Number(e.target.value)})}>{[12,24,36,48].map(n=><option key={n} value={n}>{n} months</option>)}</select></label></div><h3>Available services</h3><div className="ylServiceGrid">{visibleServices.map(id=>{const cfg=data.settings.serviceConfig[id]||{};return <button key={id} className={draft.selectedServices.includes(id)?'selected':''} onClick={()=>toggleService(id)}><span>{services[id]?.icon||'✓'}</span><b>{cfg.label||id}</b><small>{draft.selectedServices.includes(id)?'Selected':'Tap to add'}</small></button>})}</div></section>{draft.selectedServices.length>0&&<section className="ylCard"><h2>Selected Services</h2>{draft.selectedServices.map(id=>{const cfg=data.settings.serviceConfig[id]||serviceConfig[id]||{};return <div className="ylSvc" key={id}><h3>{services[id]?.icon||'✓'} {cfg.label}</h3><div className="ylGrid two">{(serviceFieldMap[id]||[['frequency','Frequency','select',(cfg.frequencies||[]).map(f=>f[0])],['difficulty','Difficulty','select',['Easy / Normal','Difficult','Very Difficult']]]).map(row=><DetailField key={row[0]} id={id} row={row}/>)}</div><Field label="Service notes" textarea value={(draft.serviceDetails[id]||{}).notes||''} onChange={v=>setSvc(id,'notes',v)}/><label className="ylUpload"><span>Service photos</span><input type="file" accept="image/*" multiple onChange={e=>savePhoto(e.target.files)}/></label></div>})}<h3>One-time services needing contractor quote</h3><div className="ylServiceGrid">{oneTimeServices.map(name=><button key={name} className={(draft.oneTimeServices||[]).includes(name)?'selected':''} onClick={()=>setDraft(d=>({ ...d, oneTimeServices:(d.oneTimeServices||[]).includes(name)?(d.oneTimeServices||[]).filter(x=>x!==name):[...(d.oneTimeServices||[]),name]}))}><b>{name}</b><small>Contractor price added later</small></button>)}</div>{(draft.oneTimeServices||[]).map(name=><div className="ylSvc" key={name}><h3>{name}</h3><Field label="Contractor quoted price" type="number" value={draft.oneTimePrices?.[name]||''} onChange={v=>setDraft(d=>({...d,oneTimePrices:{...(d.oneTimePrices||{}),[name]:v}}))}/><p className="ylHint">Agreement note: Yard Loop will contact a contractor for a separate estimate. If approved, the service price plus Yard Loop margin can be split into monthly billing.</p></div>)}</section>}<section className="ylCard"><h2>Price / Margin</h2><div className="ylStats"><article><b>{money(calc.monthly)}</b><span>Monthly</span></article><article><b>{money(calc.annual)}</b><span>Annual</span></article><article><b>{pct(calc.margin)}</b><span>Margin</span></article><article><b>{calc.dealGrade}</b><span>Grade</span></article></div><Field label="Discount %" type="number" value={draft.discountPct} onChange={v=>setDraft({...draft,discountPct:v,ownerApproved:false,ownerApprovedPrice:''})}/><p className="ylHint">Point pricing stays in the background. Reps see service dollar amounts and monthly totals; owner pricing settings can edit the hidden point/cost logic.</p></section></section>}
      {estimateWizardTab==='pay'&&<section className="ylCard"><h2>Initial Payment Information</h2><div className="ylGrid two"><label className="ylField"><span>Method</span><select value={draft.paymentMethod||'Credit Card'} onChange={e=>setDraft({...draft,paymentMethod:e.target.value})}>{['Credit Card','ACH / E-check','Check','Cash'].map(x=><option key={x}>{x}</option>)}</select></label><label className="ylField"><span>Auto Pay</span><select value={draft.autoPay||'CC autopay'} onChange={e=>setDraft({...draft,autoPay:e.target.value,paymentStatus:e.target.value.includes('ACH')?'ACH enrolled':'Card on file'})}>{['CC autopay','ACH autopay'].map(x=><option key={x}>{x}</option>)}</select></label></div><button className="ylPrimary" onClick={()=>setCcModal(true)}>Collect Card Securely</button><p className="ylHint">Security rule: card and ACH details must be collected through Stripe or Jobber secure checkout. Yard Loop CRM does not display, store, or transmit raw card number, CVV, or bank numbers.</p><h3>Billing Address</h3><div className="ylGrid two"><Field label="Billing name" value={draft.billingName||draft.name||''} onChange={v=>setDraft({...draft,billingName:v})}/><Field label="Billing address" value={draft.billingAddress||draft.address||''} onChange={v=>setDraft({...draft,billingAddress:v})}/><Field label="Billing city" value={draft.billingCity||draft.city||''} onChange={v=>setDraft({...draft,billingCity:v})}/><Field label="Billing state" value={draft.billingState||draft.state||''} onChange={v=>setDraft({...draft,billingState:v})}/><Field label="Billing ZIP" value={draft.billingZip||draft.zip||''} onChange={v=>setDraft({...draft,billingZip:v})}/></div></section>}
      {estimateWizardTab==='agree'&&<section className="ylCard"><h2>Agree</h2>{draft.signedAgreementLocked?renderAgreementSnapshot():<><button className="ylPrimary" onClick={()=>setDraft({...draft,agreementGeneratedAt:new Date().toISOString()})}>Regenerate Agreement</button>{draft.agreementGeneratedAt?renderAgreementPreview():<p className="ylHint">Review or edit the Info, Services, and Pay tabs first. Then press Regenerate Agreement to create the updated service agreement.</p>}<div className="ylActions"><button onClick={()=>saveEstimate('Estimate Submitted')}>Send as Estimate</button><button className="ylPrimary" disabled={calc.closeLocked} onClick={()=>saveEstimate('Signed')}>Sign Agreement</button></div></>}<p className="ylHint">Send as Estimate saves the agreement into Leads and emails the customer. Sign Agreement activates the customer/jobs flow, sends the signed copy when email is configured, and locks this agreement copy.</p></section>}
      {estimateWizardTab==='status'&&<section className="ylCard"><h2>Status</h2><Field label="Service begin date" type="date" value={draft.serviceBeginDate||''} onChange={v=>setDraft({...draft,serviceBeginDate:v})}/><Field label="Status notes" textarea value={draft.statusNotes||''} onChange={v=>setDraft({...draft,statusNotes:v})}/><div className="ylActions"><button onClick={saveStatusNotes}>Confirm Status Notes</button></div><p className="ylHint">Status notes are only confirmed when you press Confirm Status Notes.</p><div className="ylActions"><button className="ylPrimary" onClick={()=>saveEstimate('Estimate Submitted')}>Submit Estimate</button><button className="ylPrimary" disabled={calc.closeLocked} onClick={()=>saveEstimate('Signed')}>Signed Contract / Activate</button></div><div className="ylActions"><button className="ylDanger" onClick={()=>setPendingRemove({type:'draft',id:'current',name:draft.name||'current estimate'})}>Remove Customer</button></div></section>}
      <div className="ylWizardNav"><button disabled={estimateTabs.indexOf(estimateWizardTab)===0} onClick={()=>setEstimateWizardTab(estimateTabs[Math.max(0,estimateTabs.indexOf(estimateWizardTab)-1)])}>← Back</button>{estimateWizardTab!=='status'&&<button className="ylPrimary" onClick={()=>setEstimateWizardTab(estimateTabs[Math.min(estimateTabs.length-1,estimateTabs.indexOf(estimateWizardTab)+1)])}>Continue →</button>}</div>
    </section>
  }


  const integrationEnvGuide={
    jobber:{title:'Jobber CRM',hint:'OAuth/GraphQL connection. Store credentials in Vercel only — never in this CRM or browser.',vars:['JOBBER_CLIENT_ID','JOBBER_CLIENT_SECRET','JOBBER_REDIRECT_URL','JOBBER_ACCESS_TOKEN','JOBBER_REFRESH_TOKEN','JOBBER_WEBHOOK_SECRET']},
    payments:{title:'Payments / Stripe',hint:'Payment credentials and webhook secrets must stay server-side in Vercel.',vars:['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_MONTHLY_PRICE_ID','STRIPE_SUCCESS_URL','STRIPE_CANCEL_URL']},
    google:{title:'Google',hint:'Maps, Analytics, and OAuth values belong in Vercel environment variables.',vars:['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY','NEXT_PUBLIC_GA_MEASUREMENT_ID','NEXT_PUBLIC_GTM_ID','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REDIRECT_URL','GOOGLE_MAPS_ENABLED','GOOGLE_ANALYTICS_ENABLED']},
    email:{title:'Email / Resend',hint:'Email is already server-side. RESEND_API_KEY is read from Vercel and never exposed here.',vars:['RESEND_API_KEY','LEAD_NOTIFY_EMAIL','EMAIL_FROM','EMAIL_REPLY_TO']},
    sms:{title:'SMS / Twilio',hint:'Optional later. Only add after texting consent language is ready.',vars:['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_FROM_NUMBER','OWNER_SMS_NUMBER']},
    quickbooks:{title:'QuickBooks',hint:'Optional accounting sync after Jobber and payments are stable.',vars:['QUICKBOOKS_CLIENT_ID','QUICKBOOKS_CLIENT_SECRET','QUICKBOOKS_REDIRECT_URL','QUICKBOOKS_COMPANY_ID','QUICKBOOKS_ACCESS_TOKEN','QUICKBOOKS_REFRESH_TOKEN']}
  }
  async function checkIntegrationStatus(){
    if(!cloudPassword){setMsg('Enter Cloud Sync Password first.');return}
    try{
      const r=await fetch('/api/integration-status',{cache:'no-store',headers:{'x-admin-password':cloudPassword}})
      const j=await r.json().catch(()=>({}))
      if(!r.ok||j.error){setMsg('Integration status blocked: '+(j.error||'unknown'));return}
      const statusSummary=Object.entries(j.providers||{}).map(([name,p])=>`${name.toUpperCase()}: ${p.configured}/${p.required} configured`).join(' | ')
      setMsg('✅ Integration environment status loaded. No secrets were shown or stored. '+statusSummary)
    }catch(e){setMsg('Integration status failed: '+e.message)}
  }
  function adminHeaders(){return {'Content-Type':'application/json','x-admin-password':cloudPassword}}
  function requireCloudPassword(){if(!cloudPassword){setMsg('Enter Cloud Sync Password first.');return false}return true}
  async function connectJobber(){
    if(!requireCloudPassword())return
    try{
      const r=await fetch('/api/jobber/connect',{headers:{'x-admin-password':cloudPassword},cache:'no-store'})
      const j=await r.json().catch(()=>({}))
      if(!r.ok||j.error){setMsg('Jobber connect blocked: '+(j.error||'check env vars'));return}
      if(j.authorizeUrl){window.open(j.authorizeUrl,'_blank','noopener,noreferrer');setMsg('Jobber authorization opened. Approve access in Jobber, then come back and use Test Jobber.')}
      else setMsg('Jobber connect did not return an authorization URL.')
    }catch(e){setMsg('Jobber connect failed: '+e.message)}
  }
  async function testJobber(){
    if(!requireCloudPassword())return
    try{const r=await fetch('/api/jobber/test',{method:'POST',headers:adminHeaders()});const j=await r.json().catch(()=>({}));setMsg(r.ok&&j.ok?'✅ Jobber connected: '+(j.result?.data?.account?.name||'account found'):'Jobber test failed: '+(j.error||'check connection'))}catch(e){setMsg('Jobber test failed: '+e.message)}
  }
  async function syncLeadToJobber(lead){
    if(!requireCloudPassword())return {ok:false,error:'Cloud password required'}
    try{
      const r=await fetch('/api/jobber/sync-lead',{method:'POST',headers:adminHeaders(),body:JSON.stringify(lead)})
      const j=await r.json().catch(()=>({}))
      const ok=r.ok&&j.ok
      const jobberClientId=j.result?.data?.clientCreate?.client?.id||''
      const error=j.error||j.userErrors?.[0]?.message||'check field mapping'
      setMsg(ok?'✅ Synced to Jobber. Verify client in Jobber.':'Jobber sync failed: '+error)
      if(ok&&lead?.id){
        const stamp={jobberSyncedAt:new Date().toISOString(),jobberSyncStatus:'Synced',jobberSyncWarning:'',jobberClientId}
        const next={...data,leads:data.leads.map(l=>l.id===lead.id?{...l,...stamp}:l),customers:data.customers.map(c=>c.id===lead.id?{...c,...stamp}:c)}
        persist(log(next,user,`Synced ${lead.name||lead.address||'record'} to Jobber`),'✅ Jobber sync saved to CRM record.')
      }
      return ok?{ok:true,jobberClientId,result:j.result}:{ok:false,error}
    }catch(e){setMsg('Jobber sync failed: '+e.message);return {ok:false,error:e.message}}
  }
  async function createJobberJob(job){
    if(!requireCloudPassword())return {ok:false,error:'Cloud password required'}
    try{
      const r=await fetch('/api/jobber/create-job',{method:'POST',headers:adminHeaders(),body:JSON.stringify(job)})
      const j=await r.json().catch(()=>({}))
      const jobberJobId=j.jobberJobId||j.result?.data?.jobCreate?.job?.id||j.result?.data?.workOrderCreate?.workOrder?.id||''
      if(r.ok&&j.ok){
        const next={...data,jobs:data.jobs.map(x=>x.id===job.id?{...x,jobberId:jobberJobId,jobberJobId,jobberSyncStatus:'Synced',jobberSyncedAt:new Date().toISOString(),jobberSyncWarning:''}:x)}
        persist(log(next,user,`Created Jobber job for ${job.customerName||job.address||'CRM job'}`),'✅ Jobber job/work order created and linked.')
        return {ok:true,jobberJobId}
      }
      const error=j.error||'check Jobber job field mapping/scopes'
      const next={...data,jobs:data.jobs.map(x=>x.id===job.id?{...x,jobberSyncStatus:'Failed',jobberSyncWarning:error,jobberSyncLastTriedAt:new Date().toISOString()}:x)}
      persist(log(next,user,`Jobber job creation failed for ${job.customerName||job.address||'CRM job'}`),'⚠️ Jobber job creation failed. Client sync may still work.')
      return {ok:false,error}
    }catch(e){setMsg('Jobber job creation failed: '+e.message);return {ok:false,error:e.message}}
  }
  async function createStripeCheckout(customer, opts={}){
    if(!requireCloudPassword())return false
    try{
      const delayFirstCharge=!!opts.delayFirstCharge
      const r=await fetch('/api/stripe/checkout',{method:'POST',headers:adminHeaders(),body:JSON.stringify({customerId:customer.id,leadId:customer.id,customerEmail:customer.email,customerName:customer.name,amountCents:Math.round(Number(customer.monthly||0)*100),name:'Yard Loop Monthly Plan',delayFirstCharge,trialDays:opts.trialDays||30})})
      const j=await r.json().catch(()=>({}))
      if(r.ok&&j.checkoutUrl){window.open(j.checkoutUrl,'_blank','noopener,noreferrer');setMsg(delayFirstCharge?'✅ Stripe opened to collect card only. First monthly charge will wait until you start billing after first service.':'✅ Stripe checkout opened in a new tab. Complete test payment, then verify webhook/billing status.');return true}
      setMsg('Stripe checkout failed: '+(j.error||'check Stripe env vars'))
      return false
    }catch(e){setMsg('Stripe checkout failed: '+e.message);return false}
  }
  async function startStripeBilling(customer){
    if(!requireCloudPassword())return false
    try{
      const r=await fetch('/api/stripe/start-billing',{method:'POST',headers:adminHeaders(),body:JSON.stringify({customerId:customer.id,subscriptionId:customer.stripeSubscriptionId||''})})
      const j=await r.json().catch(()=>({}))
      if(r.ok&&j.ok){setMsg('✅ Stripe billing started. The first monthly charge should now process through Stripe.');return true}
      setMsg('Start billing failed: '+(j.error||'missing Stripe subscription ID'))
      return false
    }catch(e){setMsg('Start billing failed: '+e.message);return false}
  }
  async function testStripeCheckout(){
    await createStripeCheckout({id:'test-'+Date.now(),email:data.settings.companyEmail||'',name:'Yard Loop Test Checkout',monthly:1})
  }
  async function sendEstimateEmail(lead, estimate){
    if(!cloudPassword||!lead?.email)return
    try{
      const r=await fetch('/api/estimate-email',{method:'POST',headers:adminHeaders(),body:JSON.stringify({lead,estimate,draft,calc})})
      const j=await r.json().catch(()=>({}))
      if(!r.ok || !j.ok) throw new Error(j.error||j.note||'Estimate email failed')
      setMsg('Estimate saved and email sent to customer.')
    }catch(e){
      const next={...data,activity:[{id:uid('act'),at:new Date().toISOString(),who:user?.name||'CRM',text:`Estimate email failed for ${lead.name||lead.address}: ${e.message}`},...(data.activity||[])].slice(0,1000)}
      persist(next,'⚠️ Estimate saved, but email failed or email is not configured.')
    }
  }
  async function generateContractAndWelcome(customer, estimate, contract){
    if(!cloudPassword) return
    let contractUrl = customer.contractUrl || ''
    try{
      const r=await fetch('/api/generate-contract',{method:'POST',headers:adminHeaders(),body:JSON.stringify({customer,estimate,contract})})
      const j=await r.json().catch(()=>({}))
      if(!r.ok || !j.ok) throw new Error(j.error||'Contract PDF generation failed')
      contractUrl = j.contractUrl || contractUrl
      if(j.contractUrl){
        const nextData={...data,contracts:data.contracts.map(c=>c.id===contract.id?{...c,contractUrl:j.contractUrl,contractPath:j.contractPath}:c),customers:data.customers.map(c=>c.id===customer.id?{...c,contractUrl:j.contractUrl}:c)}
        persist(log(nextData,user,`Generated contract PDF for ${customer.name}`),'✅ Signed contract PDF generated.')
      }
    }catch(e){
      const next={...data,activity:[{id:uid('act'),at:new Date().toISOString(),who:user?.name||'CRM',text:`Contract PDF generation failed for ${customer.name}: ${e.message}`},...(data.activity||[])].slice(0,1000)}
      persist(next,'⚠️ Contract PDF generation failed; customer was still saved.')
    }
    try{
      const r=await fetch('/api/welcome-email',{method:'POST',headers:adminHeaders(),body:JSON.stringify({customer:{...customer,contractUrl},estimate,contract:{...contract,contractUrl}})})
      const j=await r.json().catch(()=>({}))
      if(!r.ok || !j.ok) throw new Error(j.error||j.note||'Welcome email failed')
    }catch(e){
      const next={...data,activity:[{id:uid('act'),at:new Date().toISOString(),who:user?.name||'CRM',text:`Welcome email failed for ${customer.name}: ${e.message}`},...(data.activity||[])].slice(0,1000)}
      persist(next,'⚠️ Welcome email failed; customer was still saved.')
    }
  }
  function openSmsComposer(target={}){
    const to=target.phone||''
    setSmsComposer({open:true,target,to,message:`Hi ${target.name||'there'}, this is Yard Loop. Your property plan is ready.`,consentConfirmed:false})
    if(!to) setMsg('Add a phone number before sending this SMS.')
  }
  async function sendSmsComposer(){
    if(!requireCloudPassword())return
    const to=String(smsComposer.to||'').trim()
    const message=String(smsComposer.message||'').trim()
    if(!to){setMsg('SMS not sent — phone number is required.');return}
    if(!message){setMsg('SMS not sent — message is required.');return}
    if(!smsComposer.consentConfirmed){setMsg('SMS not sent — customer consent checkbox must be checked.');return}
    try{const r=await fetch('/api/twilio/send',{method:'POST',headers:adminHeaders(),body:JSON.stringify({to,message,consentConfirmed:true})});const j=await r.json().catch(()=>({}));setMsg(r.ok&&j.ok?'✅ SMS sent.':'SMS failed: '+(j.error||'check Twilio setup')); if(r.ok&&j.ok)setSmsComposer({open:false,target:null,to:'',message:'',consentConfirmed:false})}catch(e){setMsg('SMS failed: '+e.message)}
  }
  async function syncSignedContract(customer, estimate){
    if(!cloudPassword)return
    const result = await syncLeadToJobber({...customer,notes:'Signed Yard Loop contract. Auto-sync from CRM signed-contract workflow.',leadId:customer.id,estimateId:estimate.id})
    if(!result?.ok){
      const warning = result?.error || 'Jobber sync failed. Use manual Sync to Jobber.'
      const next = {...data, customers:data.customers.map(c=>c.id===customer.id?{...c,jobberSyncStatus:'Failed',jobberSyncWarning:warning,jobberSyncLastTriedAt:new Date().toISOString()}:c)}
      persist(log(next,user,`Jobber sync failed for ${customer.name}`),'⚠️ Signed contract saved, but Jobber sync failed. Use manual Sync to Jobber.')
    }
    if(customer.paymentStatus==='Manual invoice approved'){createStripeCheckout(customer)}
  }
  function renderIntegrationCard(provider){
    const schema=integrationEnvGuide[provider]
    const current=data.settings.integrations?.[provider]||{}
    return <section className="ylCard" key={provider}><h2>{schema.title}</h2><p className="ylHint">{schema.hint}</p><div className="ylBanner yellow"><b>Security rule:</b> do not paste real API keys, client secrets, access tokens, refresh tokens, or webhook secrets into this CRM. Add them in Vercel → Project → Settings → Environment Variables.</div><p><Badge value={current.enabled?'Enabled':'Disabled'}/> <Badge value={current.status||'Env-only setup'}/></p><h3>Vercel environment variable checklist</h3>{schema.vars.map(v=><p className="ylLine" key={v}><b>{v}</b><small>Add this in Vercel if this provider needs it.</small></p>)}<Field label="Public notes / setup status only" value={current.notes||''} textarea onChange={v=>updateSettings(['integrations',provider],{...current,notes:v})}/>{['payments','email'].includes(provider)&&<Field label="Public from/status email only" value={current.from||current.ownerEmail||''} onChange={v=>updateSettings(['integrations',provider],{...current,from:v,ownerEmail:v})}/>}<div className="ylActions"><button onClick={checkIntegrationStatus}>Check Env Status</button>{provider==='jobber'&&<><button onClick={connectJobber}>Connect Jobber</button><button onClick={testJobber}>Test Jobber</button></>}{provider==='payments'&&<button onClick={testStripeCheckout}>Open $1 Stripe Test Checkout</button>}{provider==='sms'&&<button onClick={()=>openSmsComposer({name:'Yard Loop Test',phone:''})}>Send Test SMS</button>}<button onClick={()=>updateSettings(['integrations',provider],{...current,lastChecked:new Date().toLocaleString(),status:'Checklist reviewed — secrets kept in Vercel'})}>Mark Checklist Reviewed</button></div></section>
  }


  if(!user) return <main className="ylCrm"><section className="ylLogin"><img src="/yard-loop-logo.png" alt="Yard Loop"/><h1>Yard Loop CRM</h1><p>Owner / Sales Rep / Contractor Operations Command Center</p><Field label="Username" value={loginId} onChange={setLoginId}/><Field label="PIN / Password" type="password" value={pin} onChange={setPin}/><Field label="Cloud Sync Password (Vercel ADMIN_PASSWORD)" type="password" value={cloudPassword} onChange={setCloudPassword}/><button className="ylPrimary" onClick={login}>Log In</button><p className="ylHint">Default owner test login: kevin / 0000. Change PINs under User Management.</p>{msg&&<p className="ylMsg">{msg}</p>}</section><CrmStyles/></main>

  return <main className="ylCrm"><aside><img src="/yard-loop-logo.png" alt="Yard Loop"/><h2>{user.name}</h2><Badge value={user.role}/><div className="ylNavGroup"><label>Dashboard / Pages</label><select value={visiblePageNav.some(x=>x.id===tab)?tab:''} onChange={e=>e.target.value&&setTab(e.target.value)}><option value="">Open dashboard/page...</option>{visiblePageNav.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></div><div className="ylNavGroup"><label>Settings</label><select value={visibleSettingsNav.some(x=>x.id===tab)?tab:''} onChange={e=>e.target.value&&setTab(e.target.value)}><option value="">Open setting...</option>{visibleSettingsNav.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></div><button onClick={saveCloud}>Save Cloud</button><button onClick={()=>loadCloud(false)}>Load Cloud</button><button onClick={exportJson}>Backup</button><button onClick={()=>setUser(null)}>Log Out</button></aside><section className="ylMain">{msg&&<div className="ylMsg">{msg}</div>}
  {pendingRemove&&<div className="ylModal"><div><h2>Remove {pendingRemove.type}?</h2><p>Are you sure you want to remove <b>{pendingRemove.name}</b>? This cannot be undone from this screen.</p><div className="ylActions"><button onClick={()=>setPendingRemove(null)}>Cancel</button><button className="ylDanger" onClick={()=>pendingRemove.type==='customer'?removeCustomer(pendingRemove.id):pendingRemove.type==='contractor'?removeContractor(pendingRemove.id):pendingRemove.type==='lead'?removeLead(pendingRemove.id):(setDraft({...blankDraft,accountManager:user.name,assignedTo:user.name}),setPendingRemove(null))}>Yes, remove</button></div></div></div>}{ccModal&&<div className="ylModal"><div><h2>Collect Card Securely</h2><p className="ylHint">For PCI safety, Yard Loop CRM no longer displays card-number or CVV fields. Collect cards only through Stripe Checkout, Stripe Elements, Jobber Payments, or another hosted payment screen. The CRM may record payment status, but it must never handle raw card numbers or CVV.</p><div className="ylBanner yellow"><b>Launch rule:</b> Use Stripe/Jobber hosted payment collection before taking real customer cards. Do not write card numbers into notes, messages, or customer fields.</div><div className="ylActions"><button onClick={()=>setCcModal(false)}>Cancel</button><button className="ylPrimary" onClick={async()=>{await createStripeCheckout({id:draft.id||('estimate-'+Date.now()),email:draft.email,name:draft.name||'Yard Loop Customer',monthly:calc.monthly});setCcModal(false);}}>Open Stripe Secure Checkout</button><button onClick={()=>{setDraft({...draft,paymentStatus:'Card collection link sent'});setCcModal(false);setMsg('Payment status marked as card collection link sent. No card number or CVV was entered into Yard Loop CRM.')}}>Mark Link Sent</button></div></div></div>}{smsComposer.open&&<section className="ylCard"><h2>Send Customer SMS</h2><p className="ylHint">Only send texts after the customer gave permission. Do not use this for marketing until Twilio/10DLC and consent language are complete.</p><div className="ylGrid two"><Field label="To phone number" value={smsComposer.to} onChange={v=>setSmsComposer({...smsComposer,to:v})}/><Field label="Message" textarea value={smsComposer.message} onChange={v=>setSmsComposer({...smsComposer,message:v})}/></div><label className="ylCheck"><input type="checkbox" checked={!!smsComposer.consentConfirmed} onChange={e=>setSmsComposer({...smsComposer,consentConfirmed:e.target.checked})}/> I confirm this customer gave permission to receive this text.</label><div className="ylActions"><button className="ylPrimary" onClick={sendSmsComposer}>Send SMS</button><button onClick={()=>setSmsComposer({open:false,target:null,to:'',message:'',consentConfirmed:false})}>Cancel</button></div></section>}{!cloudPassword&&<div className="ylBanner red"><b>Cloud Sync Not Configured:</b> CRM data is local-only on this browser until the Cloud Sync Password is entered and Save Cloud succeeds.</div>}{data.users?.some(u=>u.fullAccess&&u.pin==='0000')&&<div className="ylBanner yellow"><b>Default Owner PIN Warning:</b> One or more owner accounts still use PIN 0000. Change owner PINs before launch.</div>}

  {tab==='dashboard'&&<section><h1>{canOwner?'Owner Daily Dashboard':'My Sales Dashboard'}</h1><div className="ylStats"><article><b>{pendingApprovals.length}</b><span>Pending Approvals</span></article><article><b>{money(mrr)}</b><span>Active MRR</span></article><article><b>{pct(avgMargin)}</b><span>Avg Quoted Margin</span></article><article><b>{data.leads.filter(l=>l.createdAt===today()).length}</b><span>New Leads Today</span></article><article><b>{data.contracts.filter(c=>String(c.signedAt||'').startsWith(today())).length}</b><span>Signed Today</span></article><article><b>{paymentMissing.length}</b><span>Payment Issues</span></article><article><b>{photoMissing.length}</b><span>Photo Issues</span></article><article className={jobberIssues.length?'bad':''}><b>{jobberIssues.length}</b><span>Jobber Sync Issues</span></article><article className={renewalsDue.length?'warn':''}><b>{renewalsDue.length}</b><span>Renewals Due</span></article><article><b>{data.contractors.filter(c=>c.status==='Approved').length}</b><span>Approved Contractors</span></article></div><div className="ylGrid two"><section className="ylCard"><h2>Needs Owner Attention</h2>{pendingApprovals.slice(0,8).map(a=><p className="ylLine" key={a.id}><b>{a.customerName} • {money(a.calc?.monthly)}/mo</b><small>{a.address} • {a.repName} • {pct(a.calc?.margin)} margin</small><Badge value={a.status}/><button onClick={()=>setTab('approvals')}>Review</button></p>)}{paymentMissing.map(c=><p className="ylLine" key={c.id}><b>{c.name}</b><small>Active but payment/ACH is not complete.</small><Badge value="Payment Missing"/></p>)}{photoMissing.map(j=><p className="ylLine" key={j.id}><b>{j.customerName} • {j.service}</b><small>Completed job missing required before/after photos.</small><Badge value="Needs Photos"/></p>)}{jobberIssues.map(c=><p className="ylLine" key={c.id}><b>{c.name}</b><small>{c.jobberSyncWarning||'Auto-sync to Jobber failed. Use manual Sync to Jobber.'}</small><Badge value="Jobber Sync Failed"/><button onClick={()=>setTab('customers')}>Review Customer</button></p>)}{renewalsDue.map(c=><p className="ylLine" key={c.id}><b>{c.name}</b><small>Renewal due {c.renewalDate||'soon'} • {money(c.monthly)}/mo</small><Badge value="Renewal Due"/><button onClick={()=>{setSelectedCustomerId(c.id);setTab('customers')}}>View Customer</button></p>)}{data.contractors.filter(c=>c.status!=='Approved').slice(0,6).map(c=><p className="ylLine" key={c.id}><b>{c.name}</b><small>Contractor added but not approved/verified yet.</small><Badge value={c.status||'Prospect'}/><button onClick={()=>setTab('contractors')}>Review Contractor</button></p>)}</section><section className="ylCard"><h2>Activity Feed</h2>{data.activity.slice(0,18).map(a=><p className="ylLine" key={a.id}><b>{a.text}</b><small>{a.who} • {new Date(a.at).toLocaleString()}</small></p>)}</section></div></section>}

  {tab==='neighborhood'&&<section><h1>Neighborhood Mode</h1><p className="ylHint">Fast door-to-door workflow. Reps do not need to type every address before knocking; add/upload nearby addresses, then tap a property to start an estimate or log a knock.</p><div className="ylGrid two"><section className="ylCard"><h2>Add / Select Property</h2><Field label="Address" value={prospectDraft.address} onChange={v=>setProspectDraft({...prospectDraft,address:v})}/><label className="ylField"><span>Status</span><select value={prospectDraft.status} onChange={e=>setProspectDraft({...prospectDraft,status:e.target.value})}>{['New Prospect','Previously Contacted','Estimate Given','Active Customer','Do Not Contact'].map(x=><option key={x}>{x}</option>)}</select></label><Field label="Notes" textarea value={prospectDraft.notes} onChange={v=>setProspectDraft({...prospectDraft,notes:v})}/><button className="ylPrimary" onClick={addProspect}>Add Prospect</button></section><section className="ylCard"><h2>Quick Door Log</h2><Field label="Current Address" value={draft.address} onChange={v=>setDraft({...draft,address:v})}/><div className="ylPills"><Pill onClick={()=>addDoorLog('No Answer')}>No Answer</Pill><Pill onClick={()=>addDoorLog('Talked')}>Talked</Pill><Pill onClick={()=>addDoorLog('Door Hanger Left')}>Door Hanger Left</Pill><Pill onClick={()=>addDoorLog('Do Not Contact')}>Do Not Contact</Pill></div><Badge value={addr.status}/><p className="ylHint">{addr.message}</p></section></div><section className="ylCard"><h2>Property List / Door History</h2><div className="ylTable">{[...data.customers.map(c=>({...c,type:'Customer'})),...data.leads.map(l=>({...l,type:'Lead'})),...data.prospects.map(p=>({...p,type:'Prospect'})),...data.doorLogs.map(d=>({...d,type:'Door Log',status:d.outcome}))].slice(0,200).map(r=><article className="ylRow" key={`${r.type}-${r.id}`}><div><b>{r.address}</b><small>{r.type} • {r.name||r.customerName||''} • {r.repName||r.assignedTo||''}</small></div><Badge value={r.status||'New Prospect'}/><button onClick={()=>{setDraft({...draft,address:r.address,name:r.name||r.customerName||'',phone:r.phone||'',email:r.email||''});setTab('estimate')}}>Open Estimate</button></article>)}</div></section></section>}

  {tab==='estimate'&&renderEstimateWizard()}

  {tab==='approvals'&&<section><h1>Owner Approval Center</h1><div className="ylGrid">{data.approvals.map(a=><section className="ylCard" key={a.id}><h2>{a.type==='Contractor'?'Contractor Approval':'Estimate Approval'}: {a.customerName}</h2><p>{a.address}</p>{a.type==='Contractor'?<><p><b>Service:</b> {a.contractor?.service}</p><p><b>Phone:</b> {a.contractor?.phone} • <b>Email:</b> {a.contractor?.email}</p><p><b>Capacity:</b> {a.contractor?.capacity}/week • <b>Area:</b> {a.contractor?.area}</p></>:<><div className="ylStats"><article><b>{money(a.calc?.monthly)}</b><span>Monthly</span></article><article><b>{pct(a.calc?.margin)}</b><span>Margin</span></article><article><b>{a.calc?.dealGrade}</b><span>Grade</span></article></div>{(a.capacityWarnings||[]).map(w=><div key={w} className="ylBanner yellow">Capacity warning: {w}</div>)}</>}<p><b>Reason:</b> {a.reason}</p><Badge value={a.status}/>{canOwner&&a.status==='Pending'&&a.type==='Contractor'&&<div className="ylActions"><button className="ylPrimary" onClick={()=>approveContractorFromApproval(a,'Approved')}>Approve Contractor</button><button onClick={()=>approveContractorFromApproval(a,'Rejected')}>Reject Contractor</button></div>}{canOwner&&a.status==='Pending'&&a.type!=='Contractor'&&<div className="ylActions"><button className="ylPrimary" onClick={()=>approveDeal(a,{status:'Approved'})}>Approve Deal</button><Field label="Counter monthly price" type="number" value={counterPriceInputs[a.id]||''} onChange={v=>setCounterPriceInputs({...counterPriceInputs,[a.id]:v})}/><button onClick={()=>{const v=counterPriceInputs[a.id]; if(v) approveDeal(a,{status:'Approved',counterPrice:v,ownerNote:'Counter price required'})}}>Approve With Counter Price</button><button onClick={()=>approveDeal(a,{status:'Rejected'})}>Reject</button></div>}{a.type!=='Contractor'&&<button onClick={()=>applyApprovalToDraft(a)}>Load Into Estimator</button>}</section>)}</div></section>}

    {tab==='leads'&&<section><h1>Leads</h1><div className="ylGrid two"><section className="ylCard"><h2>New Lead</h2><Field label="Name" value={leadDraft.name} onChange={v=>setLeadDraft({...leadDraft,name:v})}/><Field label="Address" value={leadDraft.address} onChange={v=>setLeadDraft({...leadDraft,address:v})}/><Field label="Phone" value={leadDraft.phone} onChange={v=>setLeadDraft({...leadDraft,phone:v})}/><Field label="Email" value={leadDraft.email} onChange={v=>setLeadDraft({...leadDraft,email:v})}/><Field label="Source" value={leadDraft.source} onChange={v=>setLeadDraft({...leadDraft,source:v})}/><Field label="Follow-up date" type="date" value={leadDraft.followUpDate} onChange={v=>setLeadDraft({...leadDraft,followUpDate:v})}/><Field label="Notes" textarea value={leadDraft.notes} onChange={v=>setLeadDraft({...leadDraft,notes:v})}/><button className="ylPrimary" onClick={addLead}>Add Lead</button></section><section className="ylCard"><h2>Search Leads</h2><Field label="Search name, address, phone, source" value={listSearch.leads} onChange={v=>setListSearch({...listSearch,leads:v})}/><label className="ylField"><span>Status / source filter</span><select value={listFilter.leads} onChange={e=>setListFilter({...listFilter,leads:e.target.value})}><option>All</option>{Array.from(new Set((data.leads||[]).flatMap(l=>[l.status,l.source]).filter(Boolean))).map(x=><option key={x}>{x}</option>)}</select></label><p className="ylHint">Showing {filteredLeads.length} of {data.leads.length} leads.</p></section></div><section className="ylCard"><h2>Lead List</h2>{filteredLeads.map(l=><p className="ylLine" key={l.id}><b>{l.name||l.address}</b><small>{l.address} • {l.phone} • {l.email} • {l.source}</small><Badge value={l.status}/><button onClick={()=>{setDraft({...draft,name:l.name||'',address:l.address||'',phone:l.phone||'',email:l.email||''});setTab('estimate')}}>Estimate</button>{canOwner&&<button onClick={()=>syncLeadToJobber(l)}>Sync to Jobber</button>}{canOwner&&<button onClick={()=>openSmsComposer(l)}>Text Lead</button>}{canOwner&&<button className="ylDanger" onClick={()=>setPendingRemove({type:'lead',id:l.id,name:l.name||l.address})}>Remove</button>}</p>)}</section></section>}

  {tab==='customers'&&<section><h1>Customers</h1><section className="ylCard"><h2>Search Customers</h2><div className="ylGrid two"><Field label="Search name, address, phone, service" value={listSearch.customers} onChange={v=>setListSearch({...listSearch,customers:v})}/><label className="ylField"><span>Status / area filter</span><select value={listFilter.customers} onChange={e=>setListFilter({...listFilter,customers:e.target.value})}><option>All</option>{Array.from(new Set((data.customers||[]).flatMap(c=>[c.status,c.city]).filter(Boolean))).map(x=><option key={x}>{x}</option>)}</select></label></div><p className="ylHint">Showing {filteredCustomers.length} of {data.customers.length} customers.</p></section>{selectedCustomer&&<section className="ylCard"><h2>Customer Detail: {selectedCustomer.name}</h2><div className="ylStats"><article><b>{money(selectedCustomer.monthly)}</b><span>Monthly</span></article><article><b>{money(selectedCustomer.annual)}</b><span>Annual</span></article><article><b>{pct(selectedCustomer.margin)}</b><span>Margin</span></article><article><b>{selectedCustomer.renewalDate||'—'}</b><span>Renewal</span></article></div><p><b>{selectedCustomer.address}</b><br/>{selectedCustomer.phone} • {selectedCustomer.email}</p><p>{(selectedCustomer.selectedServices||[]).map(id=>data.settings.serviceConfig[id]?.label||id).join(', ')}</p><Field label="Customer notes" textarea value={selectedCustomer.notes||''} onChange={v=>persist(log({...data,customers:data.customers.map(x=>x.id===selectedCustomer.id?{...x,notes:v,updatedAt:new Date().toISOString()}:x)},user,'Updated customer notes'),'Customer notes saved')}/><h3>Jobs</h3>{data.jobs.filter(j=>j.customerId===selectedCustomer.id||norm(j.address)===norm(selectedCustomer.address)).map(j=><p className="ylLine" key={j.id}><b>{j.service}</b><small>{j.status} • Due {j.due||'—'} • Contractor {j.contractor||'Unassigned'}</small></p>)}<h3>Contracts</h3>{data.contracts.filter(c=>c.customerId===selectedCustomer.id).map(c=><p className="ylLine" key={c.id}><b>{c.status} • {money(c.monthly)}/mo</b><small>Signed {String(c.signedAt||'').slice(0,10)}</small>{c.contractUrl&&<a href={c.contractUrl} target="_blank">Download Contract PDF</a>}</p>)}<button onClick={()=>setSelectedCustomerId('')}>Close Detail</button></section>}<div className="ylTable">{filteredCustomers.map(c=><article className="ylRow" key={c.id}><div><b>{c.name}</b><small>{c.address} • {c.phone} • {c.email}</small><small>{(c.selectedServices||[]).map(id=>data.settings.serviceConfig[id]?.label||id).join(', ')}</small>{c.jobberSyncStatus==='Failed'&&<small className="ylWarnText">⚠️ {c.jobberSyncWarning||'Jobber sync failed — use manual Sync to Jobber.'}</small>}</div>{c.jobberSyncStatus==='Failed'&&<Badge value="Jobber Sync Failed"/>}<Badge value={c.status}/><Badge value={c.paymentStatus}/><Badge value={c.routeScore}/><b>{money(c.monthly)}/mo</b><button onClick={()=>setSelectedCustomerId(c.id)}>Details</button>{canOwner&&<button onClick={()=>setPendingRemove({type:'customer',id:c.id,name:c.name||c.address})}>Remove</button>}<button onClick={()=>setDraft({...blankDraft,name:c.name,address:c.address,phone:c.phone,email:c.email,city:c.city,selectedServices:c.selectedServices||[],serviceDetails:c.measurements||{},propertyTier:'medium',accountManager:user.name,assignedTo:user.name})}>Upsell / Change</button>{canOwner&&<button onClick={()=>syncLeadToJobber(c)}>Sync to Jobber</button>}{canOwner&&<button onClick={()=>createStripeCheckout(c)}>Stripe Checkout</button>}{canOwner&&<button onClick={()=>createStripeCheckout(c,{delayFirstCharge:true,trialDays:30})}>Collect Card - Charge After First Service</button>}{canOwner&&c.stripeSubscriptionId&&<button onClick={()=>startStripeBilling(c)}>Start Billing After First Service</button>}{canOwner&&<button onClick={()=>openSmsComposer(c)}>Text</button>}{canOwner&&<button onClick={()=>persist(log({...data,customers:data.customers.map(x=>x.id===c.id?{...x,status:x.status==='Paused'?'Active':'Paused'}:x)},user,'Updated customer pause status'),'Customer updated')}>{c.status==='Paused'?'Reactivate':'Pause'}</button>}</article>)}</div></section>}

  {tab==='contractors'&&canOwner&&<section><h1>Contractor Management</h1><div className="ylGrid two"><section className="ylCard"><h2>Add Contractor</h2><Field label="Company" value={contractorDraft.name} onChange={v=>setContractorDraft({...contractorDraft,name:v})}/><Field label="Service" value={contractorDraft.service} onChange={v=>setContractorDraft({...contractorDraft,service:v})}/><Field label="Phone" value={contractorDraft.phone} onChange={v=>setContractorDraft({...contractorDraft,phone:v})}/><Field label="Email" value={contractorDraft.email} onChange={v=>setContractorDraft({...contractorDraft,email:v})}/><Field label="Area" value={contractorDraft.area} onChange={v=>setContractorDraft({...contractorDraft,area:v})}/><Field label="Capacity / week" type="number" value={contractorDraft.capacity} onChange={v=>setContractorDraft({...contractorDraft,capacity:v})}/><button onClick={()=>addContractor('Prospect')}>Add Prospect</button><button className="ylPrimary" onClick={()=>addContractor('Approved')}>Add Approved Contractor</button></section><section className="ylCard"><h2>Search Contractors</h2><Field label="Search company, service, area" value={listSearch.contractors} onChange={v=>setListSearch({...listSearch,contractors:v})}/><label className="ylField"><span>Status / service / area filter</span><select value={listFilter.contractors} onChange={e=>setListFilter({...listFilter,contractors:e.target.value})}><option>All</option>{Array.from(new Set((data.contractors||[]).flatMap(c=>[c.status,c.service,c.area]).filter(Boolean))).map(x=><option key={x}>{x}</option>)}</select></label><p>Contractor score uses completed jobs, photo proof, and complaint/callback notes.</p></section></div><div className="ylTable">{filteredContractors.map(c=>{const sc=contractorScore(c);return <article className="ylRow" key={c.id}><div><b>{c.name}</b><small>{c.service} • {c.area} • {c.phone} • {c.email}</small><small>Capacity: {c.capacity}/week • Score: {sc} ({scoreToGrade(sc)})</small></div><Badge value={c.status}/><Badge value={scoreToGrade(sc)}/><Badge value={c.insurance==='Verified'?'Verified':'Pending'}/><Badge value={c.w9==='Verified'?'Verified':'Pending'}/><Badge value={c.agreement==='Signed'?'Signed':'Pending'}/><button onClick={()=>updateContractor(c.id,{status:c.status==='Approved'?'Prospect':'Approved'})}>{c.status==='Approved'?'Deactivate':'Approve'}</button><button onClick={()=>updateContractor(c.id,{insurance:'Verified',w9:'Verified',agreement:'Signed',status:'Approved'})}>Verify All</button></article>})}</div></section>}

  {tab==='jobs'&&canOwner&&<section><h1>Jobs / Completion Photos</h1><div className="ylGrid two"><section className="ylCard"><h2>Add Job</h2><Field label="Customer" value={jobDraft.customerName} onChange={v=>setJobDraft({...jobDraft,customerName:v})}/><Field label="Address" value={jobDraft.address} onChange={v=>setJobDraft({...jobDraft,address:v})}/><Field label="Service" value={jobDraft.service} onChange={v=>setJobDraft({...jobDraft,service:v})}/><Field label="Contractor" value={jobDraft.contractor} onChange={v=>setJobDraft({...jobDraft,contractor:v})}/><Field label="Due" type="date" value={jobDraft.due} onChange={v=>setJobDraft({...jobDraft,due:v})}/><button className="ylPrimary" onClick={addJob}>Add Job</button></section><section className="ylCard"><h2>Search Jobs</h2><Field label="Search customer, address, service, contractor" value={listSearch.jobs} onChange={v=>setListSearch({...listSearch,jobs:v})}/><label className="ylField"><span>Status / service filter</span><select value={listFilter.jobs} onChange={e=>setListFilter({...listFilter,jobs:e.target.value})}><option>All</option>{Array.from(new Set((data.jobs||[]).flatMap(j=>[j.status,j.service]).filter(Boolean))).map(x=><option key={x}>{x}</option>)}</select></label><p className="ylHint">Showing {filteredJobs.length} of {data.jobs.length} jobs.</p></section></div><div className="ylTable">{filteredJobs.map(j=><article className="ylRow" key={j.id}><div><b>{j.customerName} • {j.service}</b><small>{j.address} • Contractor: {j.contractor||'Unassigned'} • Due: {j.due||'—'}</small><small>{j.beforePhoto?'Before photo uploaded':'Missing before photo'} • {j.afterPhoto?'After photo uploaded':'Missing after photo'}</small>{j.beforePhotoUrl&&<a href={j.beforePhotoUrl} target="_blank">View before photo</a>} {j.afterPhotoUrl&&<a href={j.afterPhotoUrl} target="_blank">View after photo</a>}</div>{j.jobberSyncStatus==='Failed'&&<Badge value="Jobber Job Failed"/>}{j.jobberId&&<Badge value="Jobber Linked"/>}<Badge value={j.status}/><button onClick={()=>createJobberJob(j)}>Create Jobber Job</button><button onClick={()=>updateJob(j.id,{status:'Assigned'})}>Assigned</button><button onClick={()=>updateJob(j.id,{status:'Completed'})}>Completed</button><label className="ylSmallUpload">Before<input type="file" accept="image/*" onChange={async e=>{const file=e.target.files?.[0]; if(!file)return; if(!cloudPassword){setMsg('Enter Cloud Sync Password first.');return} const fd=new FormData(); fd.append('file',file); const r=await fetch('/api/upload',{method:'POST',headers:{'x-admin-password':cloudPassword},body:fd}); const x=await r.json().catch(()=>({})); if(x.url) updateJob(j.id,{beforePhoto:'Uploaded '+today(),beforePhotoUrl:x.url}); else setMsg('Before photo upload failed.')}}/></label><label className="ylSmallUpload">After<input type="file" accept="image/*" onChange={async e=>{const file=e.target.files?.[0]; if(!file)return; if(!cloudPassword){setMsg('Enter Cloud Sync Password first.');return} const fd=new FormData(); fd.append('file',file); const r=await fetch('/api/upload',{method:'POST',headers:{'x-admin-password':cloudPassword},body:fd}); const x=await r.json().catch(()=>({})); if(x.url) updateJob(j.id,{afterPhoto:'Uploaded '+today(),afterPhotoUrl:x.url}); else setMsg('After photo upload failed.')}}/></label></article>)}</div></section>}

  {tab==='capacity'&&canOwner&&<section><h1>Capacity Management</h1><p className="ylHint">Prevents overselling. Add estimated available weekly capacity by service and area. Current mode: {data.settings.capacityEnforcement||'warning'}.</p><div className="ylActions"><button onClick={seedTestCapacity}>Load Starter Test Capacity</button><button onClick={()=>updateSettings(['capacityEnforcement'],'warning')}>Set Warning Only</button><button onClick={()=>updateSettings(['capacityEnforcement'],'strict')}>Set Strict Before Launch</button></div><div className="ylGrid two"><section className="ylCard"><h2>Set Capacity</h2>{data.settings.serviceAreas.map(area=><div key={area} className="ylMini"><b>{area}</b>{Object.values(data.settings.serviceConfig).filter(s=>!s.hidden).slice(0,8).map(s=><label key={s.id}><span>{s.label}</span><input type="number" placeholder="0" onBlur={e=>e.target.value&&saveCapacity(area,s.label,e.target.value)}/></label>)}</div>)}</section><section className="ylCard"><h2>Current Capacity</h2>{(data.settings.capacity||[]).map(c=><p className="ylLine" key={c.id}><b>{c.area} • {c.service}</b><small>{c.capacity} jobs/week capacity</small></p>)}</section></div></section>}

  {tab==='pricing'&&canOwner&&<section><h1>Pricing / Admin Controls</h1><p className="ylHint">Owner-only. Sales reps cannot change these settings.</p><div className="ylGrid two"><section className="ylCard"><h2>Margin Rules</h2><Field label="Green margin minimum %" type="number" value={data.settings.minGreenMargin} onChange={v=>updateSettings(['minGreenMargin'],v)}/><Field label="Yellow margin minimum %" type="number" value={data.settings.minYellowMargin} onChange={v=>updateSettings(['minYellowMargin'],v)}/><Field label="Hard margin floor %" type="number" value={data.settings.hardMarginFloor} onChange={v=>updateSettings(['hardMarginFloor'],v)}/><Field label="Max rep discount without approval %" type="number" value={data.settings.maxRepDiscountPct} onChange={v=>updateSettings(['maxRepDiscountPct'],v)}/><label className="ylField"><span>Capacity Enforcement</span><select value={data.settings.capacityEnforcement||'warning'} onChange={e=>updateSettings(['capacityEnforcement'],e.target.value)}><option value="off">Off / Test Mode</option><option value="warning">Warning Only</option><option value="strict">Strict Mode - block signing</option></select></label><p className="ylHint">Use Warning Only while testing. Switch to Strict Mode before launch when contractors are loaded.</p></section><section className="ylCard"><h2>Property Tiers</h2>{data.settings.masterPricing.tiers.map((t,i)=><div className="ylMini" key={t.id}><input value={t.name} onChange={e=>{const tiers=[...data.settings.masterPricing.tiers];tiers[i]={...t,name:e.target.value};updateSettings(['masterPricing','tiers'],tiers)}}/><input type="number" value={t.basePrice} onChange={e=>{const tiers=[...data.settings.masterPricing.tiers];tiers[i]={...t,basePrice:Number(e.target.value)};updateSettings(['masterPricing','tiers'],tiers)}}/><input type="number" value={t.pricePerPoint} onChange={e=>{const tiers=[...data.settings.masterPricing.tiers];tiers[i]={...t,pricePerPoint:Number(e.target.value)};updateSettings(['masterPricing','tiers'],tiers)}}/></div>)}</section><section className="ylCard"><h2>Service Points / Costs / Frequencies</h2><p className="ylHint">Use these boxes to control each service. Base points/cost apply when a frequency row does not override them. Frequency points/cost let you set exact pricing for 1x, 2x, 4x, etc.</p>{Object.entries(data.settings.serviceConfig).map(([id,s])=><div className="ylMini" key={id}><b>{s.label}</b><label><input type="checkbox" checked={s.enabled!==false} onChange={e=>updateSettings(['serviceConfig',id],{...s,enabled:e.target.checked})}/> Enabled</label><label><input type="checkbox" checked={s.hidden===true} onChange={e=>updateSettings(['serviceConfig',id],{...s,hidden:e.target.checked})}/> Hidden job</label><div className="ylGrid two"><Field label="Base service points" type="number" value={s.basePoints} onChange={v=>updateSettings(['serviceConfig',id],{...s,basePoints:Number(v)})}/><Field label="Base contractor cost / year" type="number" value={s.baseCost} onChange={v=>updateSettings(['serviceConfig',id],{...s,baseCost:Number(v)})}/><Field label="Default annual frequency" type="number" value={s.defaultAnnual} onChange={v=>updateSettings(['serviceConfig',id],{...s,defaultAnnual:Number(v)||1})}/></div><h4>Frequency pricing boxes</h4>{normalizeFreqs(s.frequencies, serviceConfig[id]?.frequencies).map((f,i)=><div className="ylFreqBox" key={i}><Field label="Frequency label" value={f[0]} onChange={v=>updateFrequencyConfig(id,i,'label',v)}/><Field label="Annual service count" type="number" value={f[1]} onChange={v=>updateFrequencyConfig(id,i,'annual',v)}/><Field label="Exact points for this frequency (blank = auto)" type="number" value={f[2]} onChange={v=>updateFrequencyConfig(id,i,'points',v)}/><Field label="Exact contractor cost for this frequency (blank = auto)" type="number" value={f[3]} onChange={v=>updateFrequencyConfig(id,i,'cost',v)}/><button onClick={()=>removeFrequencyConfig(id,i)}>Remove Frequency</button></div>)}<button onClick={()=>addFrequencyConfig(id)}>Add Frequency Option</button></div>)}</section></div></section>}

  {tab==='users'&&canOwner&&<section><h1>User Management</h1><div className="ylGrid two"><section className="ylCard"><h2>Add User</h2><Field label="Name" value={newUser.name} onChange={v=>setNewUser({...newUser,name:v})}/><Field label="Username" value={newUser.username} onChange={v=>setNewUser({...newUser,username:v})}/><label className="ylField"><span>Role</span><select value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})}><option>Owner</option><option>Manager</option><option>Sales Rep</option><option>Office Staff</option></select></label><Field label="PIN" type="password" value={newUser.pin} onChange={v=>setNewUser({...newUser,pin:v})}/><button className="ylPrimary" onClick={addUser}>Add User</button></section><section className="ylCard"><h2>Rep Permission Rules</h2><p>Sales reps can build estimates, log doors, request approvals, and save deals. They cannot edit pricing, contractor cost, margin floors, approvals, company reports, integrations, or user permissions.</p></section></div>{data.users.map(u=><p className="ylLine" key={u.id}><b>{u.name}</b><small>{u.role} • username: {u.username}</small><Badge value={u.fullAccess?'Full Access':'Limited'}/><button onClick={()=>updateUser(u.id,{active:!u.active})}>{u.active?'Disable':'Enable'}</button></p>)}</section>}

  {tab==='reports'&&canOwner&&<section><h1>Reports</h1><div className="ylStats"><article><b>{money(mrr)}</b><span>MRR</span></article><article><b>{money(mrr*12)}</b><span>Annualized Active</span></article><article><b>{money(data.estimates.reduce((a,e)=>a+Number(e.calc?.annual||0),0))}</b><span>Annual Quoted</span></article><article><b>{pct(avgMargin)}</b><span>Avg Margin</span></article><article><b>{data.leads.length}</b><span>Leads</span></article><article><b>{data.contracts.length}</b><span>Contracts</span></article></div><section className="ylCard"><h2>Deal List</h2>{data.estimates.slice(0,100).map(e=><p className="ylLine" key={e.id}><b>{e.draft?.name} • {money(e.calc?.monthly)}/mo</b><small>{e.status} • {e.repName} • {pct(e.calc?.margin)} margin • Grade {e.calc?.dealGrade}</small><Badge value={e.calc?.marginStatus}/></p>)}</section></section>}

  {tab==='documents'&&canOwner&&<section><h1>Documents / Contracts / Service Pause</h1><div className="ylGrid"><section className="ylCard"><h2>Document Center</h2><button onClick={()=>persist({...data,documents:[{id:uid('doc'),kind:'Contract Note',title:'Contract Note',createdAt:today(),status:'Active'},...data.documents]},'Document added')}>Add Contract Note</button><button onClick={()=>persist({...data,documents:[{id:uid('doc'),kind:'Service Pause',title:'Service Pause',createdAt:today(),status:'Active'},...data.documents]},'Pause record added')}>Create Pause Record</button><button className="ylPrimary" onClick={exportJson}>Download All CRM Data</button></section></div></section>}

  {tab==='integrations'&&canOwner&&<section><h1>Integration Setup</h1><p className="ylHint">Backend CRM integration checklist. This screen does not store secrets. API keys and OAuth secrets must be added in Vercel Environment Variables only.</p><div className="ylBanner blue"><b>Backend-only rule:</b> use this page to track setup only. Do not paste real credentials into the browser, localStorage, or Blob data.</div><div className="ylGrid two">{['jobber','payments','google','email','sms','quickbooks'].map(renderIntegrationCard)}</div></section>}

  {tab==='training'&&<section><h1>Sales Training</h1><div className="ylGrid"><section className="ylCard"><h2>Core Pitch</h2><p>Yard Loop bundles exterior home maintenance into one simple monthly plan so homeowners are not chasing mowing, gutters, windows, washing, mulch, and seasonal services separately.</p></section><section className="ylCard"><h2>Rep Rule</h2><p>Customize inside the guardrails. If the margin is red or the discount is too high, request owner approval before closing.</p></section><section className="ylCard"><h2>Neighborhood Rule</h2><p>Check property status before knocking. Active customers are for upsells, service issues, or neighbor referrals — never duplicate contracts.</p></section></div></section>}

  {tab==='settings'&&canOwner&&<section><h1>Settings / Backup</h1><div className="ylGrid two"><section className="ylCard"><h2>Company</h2><Field label="Company Name" value={data.settings.companyName} onChange={v=>updateSettings(['companyName'],v)}/><Field label="Company Email" value={data.settings.companyEmail} onChange={v=>updateSettings(['companyEmail'],v)}/><Field label="Company Phone" value={data.settings.companyPhone} onChange={v=>updateSettings(['companyPhone'],v)}/><Field label="Service Areas" value={(data.settings.serviceAreas||[]).join(', ')} onChange={v=>updateSettings(['serviceAreas'],v.split(',').map(x=>x.trim()).filter(Boolean))}/></section><section className="ylCard"><h2>Cloud / Backup</h2><Field label="Cloud Sync Password" type="password" value={cloudPassword} onChange={setCloudPassword}/><button className="ylPrimary" onClick={saveCloud}>Save Shared Cloud Copy</button><button onClick={()=>loadCloud(false)}>Load Shared Cloud Copy</button><button onClick={exportJson}>Download Local Backup</button><label className="ylUpload"><span>Import Backup JSON</span><input type="file" accept="application/json" onChange={e=>importJson(e.target.files?.[0])}/></label></section></div></section>}

  </section><CrmStyles/></main>
}

function CrmStyles(){return <style jsx global>{`
  .ylCrm{min-height:100vh;background:#f3f7ef;color:#102033;font-family:Arial,Helvetica,sans-serif}.ylCrm *{box-sizing:border-box}.ylLogin{max-width:440px;margin:34px auto;background:white;border:1px solid #dfe9d9;border-radius:22px;padding:24px;box-shadow:0 12px 35px rgba(0,0,0,.08)}.ylLogin img{max-width:190px;display:block;margin:0 auto 10px}.ylCrm aside{position:sticky;top:0;z-index:1000;width:100%;background:#0d253f;color:white;padding:12px 18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;box-shadow:0 8px 24px rgba(0,0,0,.12)}.ylCrm aside img{max-width:120px;background:white;border-radius:14px;padding:6px;margin:0 6px 0 0}.ylCrm aside button{display:inline-block;width:auto;text-align:left;background:transparent;color:white;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px 12px;margin:0;font-weight:800;white-space:nowrap}.ylCrm aside button.active,.ylCrm aside button:hover{background:#49a942}.ylNavGroup{border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:8px;margin:0;background:rgba(255,255,255,.05);min-width:190px}.ylNavGroup label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9fd45a;font-weight:900;margin-bottom:7px}.ylNavGroup select,.ylMobileJump select{width:100%;border:1px solid #cbd8c5;border-radius:12px;padding:10px;font-weight:900;color:#0d253f;background:white}.ylMobileJump{display:none;gap:8px;align-items:center;position:sticky;top:0;z-index:30;background:#f3f7ef;padding:0 0 12px;margin-bottom:12px}.ylMobileJump button{border:1px solid #cbd8c5;border-radius:12px;background:white;color:#0d253f;font-weight:900;padding:10px 12px}.ylMobileJump button.active{background:#49a942;color:white}.ylMain{margin-left:0;padding:24px}.ylMain h1{font-size:28px;margin:0 0 16px;color:#0d253f}.ylCard{background:white;border:1px solid #dfe9d9;border-radius:18px;padding:18px;margin-bottom:16px;box-shadow:0 5px 18px rgba(0,0,0,.04)}.ylCard h2{margin:0 0 12px;color:#0d253f}.ylGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}.ylGrid.two{grid-template-columns:repeat(auto-fit,minmax(340px,1fr))}.ylStats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:18px}.ylStats article{background:white;border:1px solid #dfe9d9;border-radius:16px;padding:14px}.ylStats article b{display:block;font-size:24px;color:#0d253f}.ylStats article span{font-size:12px;font-weight:800;color:#607080}.ylStats article.good{border-color:#49a942;background:#eef9ec}.ylStats article.warn{border-color:#e6b44c;background:#fff9e9}.ylStats article.bad{border-color:#dc2626;background:#fff1f1}.ylField{display:block;margin-bottom:12px}.ylField span,.ylMini span{display:block;font-size:12px;font-weight:900;color:#52677a;margin-bottom:4px}.ylField input,.ylField textarea,.ylField select,.ylMini input{width:100%;border:1px solid #d1dde8;border-radius:12px;padding:10px;font-size:14px}.ylField textarea{min-height:90px}.ylPrimary{background:#49a942!important;color:white!important;border:0!important}.ylActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.ylActions button,.ylCard button,.ylPrimary{border:1px solid #cbd8c5;border-radius:12px;background:white;color:#0d253f;font-weight:900;padding:10px 12px}.ylActions button:disabled{opacity:.45;background:#ddd!important}.ylPills{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.ylPill{border:1px solid #cbd8c5;border-radius:999px;background:white;padding:8px 12px;font-weight:800}.ylPill.active{background:#49a942;color:white;border-color:#49a942}.ylBadge{display:inline-block;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:900;margin:3px}.ylBadge.green{background:#e9f8e5;color:#256d22}.ylBadge.yellow{background:#fff7df;color:#87620d}.ylBadge.red{background:#ffeaea;color:#a51f1f}.ylBadge.blue{background:#e9f1ff;color:#174a7a}.ylMsg{background:#0d253f;color:white;border-radius:14px;padding:12px 14px;margin-bottom:14px;font-weight:800}.ylHint{font-size:13px;color:#5f7182;line-height:1.45}.ylBanner{padding:12px 14px;border-radius:14px;margin-bottom:12px;font-weight:800;border:1px solid #dfe9d9}.ylBanner.green{background:#e9f8e5;color:#256d22}.ylBanner.yellow{background:#fff7df;color:#87620d}.ylBanner.red{background:#ffeaea;color:#a51f1f}.ylBanner.blue{background:#e9f1ff;color:#174a7a}.ylServiceGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.ylServiceGrid button{min-height:108px;border:2px solid #d8e5d2;border-radius:16px;background:white;text-align:left;padding:12px}.ylServiceGrid button.selected{border-color:#49a942;background:#f0faed}.ylServiceGrid span{font-size:24px;display:block}.ylServiceGrid b{display:block}.ylServiceGrid small{color:#637789}.ylSvc{border:1px solid #e0eadc;background:#fbfdf9;border-radius:14px;padding:14px;margin-bottom:12px}.ylUpload{display:block;border:2px dashed #cbd8c5;border-radius:14px;padding:14px;margin:10px 0}.ylPhotos{display:flex;gap:8px;flex-wrap:wrap}.ylPhotos img{width:92px;height:72px;object-fit:cover;border-radius:10px;border:1px solid #dfe9d9}.ylCheck{display:flex;gap:8px;font-weight:800;margin:10px 0}.ylSig canvas{width:100%;height:150px;border:1px solid #d1dde8;border-radius:14px;background:white}.ylLine{border-bottom:1px solid #edf2ea;padding:10px 0;margin:0}.ylLine b{display:block}.ylLine small{display:block;color:#607080}.ylTable{display:grid;gap:8px}.ylRow{display:grid;grid-template-columns:1fr auto auto auto;gap:10px;align-items:center;background:white;border:1px solid #dfe9d9;border-radius:16px;padding:12px}.ylRow b{display:block}.ylRow small{display:block;color:#607080}.ylMini{border:1px solid #e3eadf;border-radius:14px;padding:10px;margin-bottom:10px;background:#fbfdf9}.ylMini label{display:block;margin:6px 0}.ylMini input{margin:4px 0}.ylFreqBox{border:1px solid #dbe6d5;background:white;border-radius:12px;padding:10px;margin:10px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;align-items:end}.ylFreqBox .ylField{margin-bottom:0}.ylWarnText{color:#a51f1f;font-weight:900}.ylSmallUpload{border:1px solid #cbd8c5;border-radius:12px;padding:9px 10px;font-weight:900;background:#fff}.ylSmallUpload input{display:none}.ylWizardTabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}.ylWizardTabs button{border:1px solid #cbd8c5;background:white;border-radius:999px;padding:10px 14px;font-weight:900}.ylWizardTabs button.active{background:#49a942;color:white;border-color:#49a942}.ylAgreementBox{background:#fbfdf9;border:1px solid #dfe9d9;border-radius:16px;padding:16px;margin-top:12px}.ylAgreementBox h3{margin-top:16px}.ylPayCalendar{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px}.ylPayCalendar span{border:1px solid #dfe9d9;border-radius:12px;padding:8px;background:white;font-size:12px}.ylPayCalendar b{display:block;font-size:16px}.ylFinePrint{font-size:10.5px;line-height:1.35;color:#43576a}.ylFinePrint p{margin:6px 0}.ylStackedMoney p{margin:4px 0}.ylWizardNav{display:flex;justify-content:space-between;gap:10px;margin:14px 0}.ylWizardNav button{border:1px solid #cbd8c5;border-radius:12px;background:white;color:#0d253f;font-weight:900;padding:10px 14px}.ylSignatureImage{max-width:360px;width:100%;border:1px solid #d1dde8;border-radius:12px;background:white}.ylAgreementLocked{border-color:#49a942;background:#f5fff2}.ylModal{position:fixed;inset:0;background:rgba(5,18,32,.58);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}.ylModal>div{background:white;border-radius:18px;max-width:460px;width:100%;padding:20px;box-shadow:0 25px 70px rgba(0,0,0,.25)}.ylDanger{background:#dc2626!important;color:#fff!important;border-color:#dc2626!important} @media(max-width:820px){.ylCrm aside{position:relative;width:auto}.ylMain{margin-left:0;padding:14px}.ylMobileJump{display:flex;flex-wrap:wrap}.ylMobileJump select{width:auto;min-width:150px;flex:1}.ylRow{grid-template-columns:1fr}.ylGrid.two{grid-template-columns:1fr}}
`}</style>}
