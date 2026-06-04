export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getContent, styleVars, isVisible } from '../lib/content'
import { SiteNav, SiteFooter, HiddenPage, Img, arr, PageHero } from '../components/Shell'
export default async function Page(){ const c=await getContent(); const key='gallery'; if(!isVisible(c,key)) return <HiddenPage c={c} name="Real work. Real homes. Real results."/>; return <main style={styleVars(c)}><SiteNav c={c}/><PageHero c={c} pageKey='gallery' eyebrow='Work photos' headline='Real work. Real homes. Real results.' subtext='Add real job photos from admin.' /><section className='section'><div className='cards'>{arr(c.gallery).map((g,i)=><article className='card photo' key={i}><Img src={g.image} label={g.label}/><h3>{g.label}</h3><p>{g.caption}</p></article>)}</div></section><SiteFooter c={c}/></main> }
