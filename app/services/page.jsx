export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getContent, styleVars, isVisible } from '../lib/content'
import { SiteNav, SiteFooter, HiddenPage, Img, arr, PageHero } from '../components/Shell'
export default async function Page(){ const c=await getContent(); const key='services'; if(!isVisible(c,key)) return <HiddenPage c={c} name="Build a plan around the outside chores you want handled."/>; return <main style={styleVars(c)}><SiteNav c={c}/><PageHero c={c} pageKey='services' eyebrow='Plans & Services' headline='Complete exterior home maintenance, organized into one plan.' subtext='Choose the services that fit your property now, with room to add more later.' /><section className='section'><div className='cards'>{arr(c.included).filter(x=>x.enabled!==false).map((s,i)=><article className='card' key={i}><Img src={s.image} label={s.title}/><h3>{s.icon} {s.title}</h3><p>{s.text}</p></article>)}</div></section><SiteFooter c={c}/></main> }
