export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getContent, styleVars, isVisible } from '../lib/content'
import { SiteNav, SiteFooter, HiddenPage, Img, arr, PageHero } from '../components/Shell'
export default async function Page(){ const c=await getContent(); const key='pricing'; if(!isVisible(c,key)) return <HiddenPage c={c} name="Point-based pricing that is easy to explain."/>; return <main style={styleVars(c)}><SiteNav c={c}/><PageHero c={c} pageKey='pricing' eyebrow='Membership pricing' headline={c.pricing?.headline} subtext='Base property plan plus the exterior services you want handled.' /><section className='section'><div className='cards'><article className='card'><h3>{c.pricing.rangeValue}</h3><p>{c.pricing.text}</p><p>{c.pricing.note}</p><a className='btn' href='/get-my-plan'>Get My Plan</a></article></div></section><SiteFooter c={c}/></main> }
