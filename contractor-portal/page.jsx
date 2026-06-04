export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getContent, styleVars } from '../lib/content'
import { SiteNav, SiteFooter, PageHero } from '../components/Shell'
import ContractorPortalClient from './ContractorPortalClient'
export default async function Page(){ const c=await getContent(); return <main style={styleVars(c)}><SiteNav c={c}/><PageHero c={c} pageKey="contractorPortal" eyebrow="Contractor portal" headline="Yard Loop job board" subtext="View assigned work, navigate to jobs, upload completion photos, and mark jobs complete."/><ContractorPortalClient/><SiteFooter c={c}/></main> }
