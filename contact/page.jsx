export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getContent, styleVars, isVisible } from '../lib/content'
import { SiteNav, SiteFooter, HiddenPage, PageHero } from '../components/Shell'
import ContactClient from './ContactClient'
import GoogleMap from '../components/GoogleMap'
export default async function Contact(){const c=await getContent(); if(!isVisible(c,'contact')) return <HiddenPage c={c} name='Contact'/>; return <main style={styleVars(c)}><SiteNav c={c}/><PageHero c={c} pageKey='contact' eyebrow={c.contactPage.heroEyebrow} headline={c.contactPage.heroHeadline} subtext={c.contactPage.heroSubtext} /><ContactClient c={c}/><GoogleMap address={c.brand?.serviceArea || 'Omaha, NE'} /><SiteFooter c={c}/></main>}
