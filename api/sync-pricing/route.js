export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../lib/adminAuth'
import { defaultContent } from '../../defaultContent'
import { hasBlobToken, readJsonBlob, writeJsonBlob } from '../../lib/blobJson'

const CMS_KEY = 'yard-loop-cms.json'
const CRM_KEY = 'yard-loop-rep-portal.json'

const defaultPointLibrary = [
  {id:'micro',name:'Micro add-on',points:.25},
  {id:'light',name:'Light add-on',points:.5},
  {id:'small',name:'Small service',points:.75},
  {id:'standard',name:'Standard service',points:1},
  {id:'standardPlus',name:'Standard plus',points:1.25},
  {id:'medium',name:'Medium service',points:1.5},
  {id:'mediumPlus',name:'Medium plus',points:1.75},
  {id:'full',name:'Full service',points:2},
  {id:'fullPlus',name:'Full plus',points:2.5},
  {id:'heavy',name:'Heavy service',points:3},
  {id:'major',name:'Major service',points:4},
  {id:'premium',name:'Premium service',points:5}
]

const serviceMap = {
  gutters2:['gutters','2x/year'], gutters1:['gutters','1x/year'],
  windows2:['windows','2x/year'], windows1:['windows','1x/year'],
  housewash:['housewash','Annual'], driveway:['concrete','Annual'], deck:['deck','Annual'], mulch:['mulch','Annual'],
  'snow-standard':['snow','Each snowfall'], 'snow-large':['snow','Each snowfall'],
  insects6:['insects','6 apps/year'], insects3:['insects','3 apps/year'],
  fertweed:['fert','4–6 visits / year'], shrub2:['shrubs','2x/year'], shrub1:['shrubs','1x/year'],
  aeration:['aeration','Once per year'], overseeding:['overseeding','1x/year'],
  'spring-cleanup':['leaves','Two-time pickup'], 'fall-leaf':['leaves','Three-time pickup'],
  'sprinkler-blowout':['sprinkler','Annual'], 'sprinkler-startup':['sprinkler','Annual'],
  'holiday-lights':['holiday','Seasonal install + removal'], 'trash-bins':['bins','Monthly'],
  'pet-waste':['dogpoop','Weekly'], 'roof-wash':['roofwash','One time']
}

function clone(obj){ return JSON.parse(JSON.stringify(obj || {})) }
function normalizeFreqs(freqs){
  return (Array.isArray(freqs)&&freqs.length?freqs:[['Annual',1,'','']]).map(f=>Array.isArray(f)?[String(f[0]||'Annual'),Number(f[1]||1),f[2]??'',f[3]??'']:[String(f?.label||'Annual'),Number(f?.annual||1),f?.points??'',f?.cost??''])
}
function upsertFreq(service, label, points, cost){
  const freqs = normalizeFreqs(service.frequencies)
  const idx = freqs.findIndex(f=>String(f[0]).toLowerCase()===String(label).toLowerCase())
  const annual = idx>=0 ? freqs[idx][1] : (String(label).match(/(\d+)/)?.[1] ? Number(String(label).match(/(\d+)/)[1]) : service.defaultAnnual || 1)
  const row = [label, annual, Number(points||0), Number(cost||0)]
  if(idx>=0) freqs[idx]=row
  else freqs.push(row)
  return freqs
}
function levelFor(points, library){
  const p=Number(points||0)
  return (library||[]).find(l=>Number(l.points)===p)?.id || ''
}
function mergePricing(cms, crm){
  const next = clone(crm)
  next.settings = next.settings || {}
  next.settings.masterPricing = next.settings.masterPricing || {}
  const cmsTiers = cms?.estimator?.tiers || []
  if(cmsTiers.length){
    const existing = next.settings.masterPricing.tiers || []
    next.settings.masterPricing.tiers = cmsTiers.map(t=>({
      ...(existing.find(x=>x.id===t.id)||{}), id:t.id, name:t.name, enabled:t.enabled!==false,
      basePrice:Number(t.basePrice||0), pricePerPoint:Number(t.pricePerPoint||0), mowingUpgrade:Number(t.mowingUpgrade||0),
      yardRange:t.yardRange||'', homeRange:t.homeRange||''
    }))
  }
  const library = cms.pointLibrary?.length ? cms.pointLibrary : (next.settings.pointLibrary?.length ? next.settings.pointLibrary : defaultPointLibrary)
  next.settings.pointLibrary = library.map(l=>({id:l.id||String(l.name||'level').toLowerCase().replace(/[^a-z0-9]+/g,'-'), name:l.name||'Point level', points:Number(l.points||0)}))
  next.settings.serviceConfig = next.settings.serviceConfig || {}
  const currentOrder = Array.isArray(next.settings.serviceOrder) ? next.settings.serviceOrder : []
  let syncedServices=0
  for(const svc of (cms?.estimator?.services||[])){
    const [crmId,freqLabel] = serviceMap[svc.id] || []
    if(!crmId || !next.settings.serviceConfig[crmId]) continue
    const current = next.settings.serviceConfig[crmId]
    const points = Number(svc.points||0)
    const cost = Number(svc.contractorCost||0)
    next.settings.serviceConfig[crmId] = {
      ...current,
      enabled: svc.enabled!==false,
      hidden: current.hidden===true && svc.enabled!==true ? current.hidden : false,
      basePoints: points,
      pointLevelId: levelFor(points,next.settings.pointLibrary),
      baseCost: cost || Number(current.baseCost||0),
      frequencies: upsertFreq(current, freqLabel || svc.frequency || 'Annual', points, cost),
      sortOrder: Number(svc.sortOrder || current.sortOrder || 999)
    }
    syncedServices++
  }
  const orderedIds = Object.keys(next.settings.serviceConfig).sort((a,b)=>Number(next.settings.serviceConfig[a]?.sortOrder||999)-Number(next.settings.serviceConfig[b]?.sortOrder||999))
  next.settings.serviceOrder = currentOrder.length ? [...currentOrder.filter(id=>orderedIds.includes(id)), ...orderedIds.filter(id=>!currentOrder.includes(id))] : orderedIds
  next.settings.difficultyMultipliers = {...{Easy:.9,Normal:1,Difficult:1.35,'Very Difficult':1.65}, ...(next.settings.difficultyMultipliers||{})}
  next.settings.syncedPricingFromAdminAt = new Date().toISOString()
  next.schemaVersion = next.schemaVersion || 'rep-portal-v1'
  next.savedAt = new Date().toISOString()
  return {next, syncedServices, syncedTiers: cmsTiers.length}
}

export async function POST(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  if(!hasBlobToken()) return NextResponse.json({error:'Vercel Blob is not connected. Add BLOB_READ_WRITE_TOKEN in Vercel.'},{status:500})
  try{
    const cms = await readJsonBlob(CMS_KEY, defaultContent)
    const crm = await readJsonBlob(CRM_KEY, {schemaVersion:'rep-portal-v1',settings:{},users:[],customers:[],leads:[],estimates:[],contracts:[],jobs:[],activity:[]})
    const {next, syncedServices, syncedTiers} = mergePricing(cms||defaultContent, crm||{})
    await writeJsonBlob(CRM_KEY, next)
    return NextResponse.json({ok:true, syncedServices, syncedTiers, savedAt:next.savedAt, data:next}, {headers:{'Cache-Control':'no-store'}})
  }catch(e){
    return NextResponse.json({error:'Pricing sync failed: '+e.message},{status:500})
  }
}
