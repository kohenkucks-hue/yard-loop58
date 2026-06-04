import { unstable_noStore as noStore } from 'next/cache'
import { defaultContent } from '../defaultContent'
import { readJsonBlob } from './blobJson'

const CMS_KEY = 'yard-loop-cms.json'


function mergeImagesByPosition(nextArr=[], oldArr=[]) {
  return nextArr.map((item, i) => ({ ...item, image: oldArr?.[i]?.image || item.image || '' }))
}

function applySafeMigration(content, saved) {
  if (!saved || saved.schemaVersion === defaultContent.schemaVersion) return content
  const migrated = { ...content, schemaVersion: defaultContent.schemaVersion }

  // Preserve uploaded logos/colors/contact info from the saved CMS, but apply the new Yard Loop messaging defaults.
  migrated.hero = { ...defaultContent.hero, image: saved.hero?.image || defaultContent.hero.image, backgroundImage: saved.hero?.backgroundImage || '' }
  migrated.trust = defaultContent.trust
  migrated.problem = defaultContent.problem
  migrated.painHeadline = defaultContent.painHeadline
  migrated.splitHeadline = defaultContent.splitHeadline
  migrated.splitText = defaultContent.splitText
  migrated.promise = mergeImagesByPosition(defaultContent.promise, saved.promise)
  migrated.included = mergeImagesByPosition(defaultContent.included, saved.included)
  migrated.how = defaultContent.how
  migrated.pointPricing = defaultContent.pointPricing
  migrated.pricing = defaultContent.pricing
  // Preserve saved estimator tiers/services so hidden future jobs that you turn ON stay live after deploy.
  migrated.estimator = deepMerge(defaultContent.estimator, saved.estimator || {})
  migrated.getMyPlan = { ...defaultContent.getMyPlan, ...(saved.getMyPlan || {}), showButtons: saved.getMyPlan?.showButtons ?? saved.modules?.showPlanButtons ?? true }
  migrated.pageHeroes = { ...content.pageHeroes, ...defaultContent.pageHeroes }
  migrated.contactPage = { ...content.contactPage, ...defaultContent.contactPage }
  migrated.finalCta = defaultContent.finalCta
  migrated.seo = defaultContent.seo
  migrated.faq = defaultContent.faq
  migrated.pages = { ...defaultContent.pages, ...(saved.pages || {}) }
  migrated.pages.home = { ...(migrated.pages.home || {}), enabled:true, state:'published', showInNav:true }
  const savedEstimatorOn = saved.modules?.estimator ?? saved.pages?.estimate?.enabled ?? true
  migrated.pages.getMyPlan = { ...(defaultContent.pages.getMyPlan || {}), ...(saved.pages?.getMyPlan || {}), enabled: saved.pages?.getMyPlan?.enabled ?? true, state: saved.pages?.getMyPlan?.state || 'published', showInNav: saved.pages?.getMyPlan?.showInNav ?? false }
  migrated.pages.estimate = { ...(migrated.pages.estimate || {}), enabled: savedEstimatorOn, state: savedEstimatorOn ? 'published' : 'hidden', showInNav: saved.pages?.estimate?.showInNav ?? false }
  migrated.modules = { ...defaultContent.modules, ...(saved.modules || {}), estimator: savedEstimatorOn, showPlanButtons: saved.modules?.showPlanButtons ?? saved.getMyPlan?.showButtons ?? true }
  migrated.contractor = { ...content.contractor, ...defaultContent.contractor }
  return migrated
}

function deepMerge(base, saved) {
  if (!saved || typeof saved !== 'object') return base
  if (Array.isArray(base) || Array.isArray(saved)) return saved ?? base
  const out = { ...base }
  for (const key of Object.keys(saved)) {
    const b = base?.[key]
    const s = saved[key]
    if (b && s && typeof b === 'object' && typeof s === 'object' && !Array.isArray(b) && !Array.isArray(s)) {
      out[key] = deepMerge(b, s)
    } else {
      out[key] = s
    }
  }
  return out
}

export async function getContent() {
  noStore()
  try {
    const saved = await readJsonBlob(CMS_KEY, null)
    return applySafeMigration(deepMerge(defaultContent, saved), saved)
  } catch (error) {
    console.error('CMS content read failed:', error)
    return defaultContent
  }
}

export function isVisible(c, key) {
  const pages = c?.pages || {}
  const page = pages?.[key] || {}
  const state = page.state || 'published'
  if (key === 'estimate') {
    return c?.modules?.estimator !== false && page.enabled !== false && state === 'published'
  }
  if (key === 'getMyPlan') {
    return page.enabled !== false && state === 'published'
  }
  return page.enabled !== false && state === 'published'
}

export function publicPages(c) {
  const labels = { home:'Home', services:'Plans & Services', howItWorks:'How It Works', pricing:'Pricing', getMyPlan: c?.getMyPlan?.navLabel || 'Get My Plan', estimate:'Estimator', gallery:'Gallery', legal:'Legal', packages:'Packages', referrals:'Referrals', customer:'Customer Portal', contractor:'Contractor Partners' }
  const hrefs = { home:'/', services:'/services', howItWorks:'/how-it-works', pricing:'/pricing', getMyPlan:'/get-my-plan', estimate:'/estimate', gallery:'/gallery', legal:'/legal', packages:'/packages', referrals:'/referrals', customer:'/customer', contractor:'/contractor' }
  return Object.keys(labels).filter(k => isVisible(c,k) && (c.pages?.[k]?.showInNav !== false)).map(k => ({ key:k, label: labels[k], href: hrefs[k] }))
}

export function styleVars(c) {
  const b = c.brand || defaultContent.brand
  return { '--navy':b.primary, '--green':b.green, '--lime':b.lime, '--gold':b.gold, '--cream':b.cream, '--ink':b.ink, '--fontHeading': b.headingFont || 'Outfit', '--fontBody': b.bodyFont || 'DM Sans' }
}
