export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getContent, styleVars, isVisible } from '../lib/content'
import { SiteNav, SiteFooter, HiddenPage, Img, arr, PageHero } from '../components/Shell'
export default async function Page(){ const c=await getContent(); const key='howItWorks'; if(!isVisible(c,key)) return <HiddenPage c={c} name="Simple for the homeowner. Organized by Yard Loop."/>; return <main style={styleVars(c)}><SiteNav c={c}/><PageHero c={c} pageKey='howItWorks' eyebrow='The process' headline='Simple for the homeowner. Organized by Yard Loop.' subtext='From custom plan request to a cleaner property all year.' /><section className='section'><div className='cards'>{arr(c.how).map((h,i)=><article className='card' key={i}><h3>{h.step} — {h.title}</h3><p>{h.text}</p></article>)}</div></section><SiteFooter c={c}/></main> }
