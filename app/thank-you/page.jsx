export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getContent, styleVars } from '../lib/content'
import { SiteNav, SiteFooter } from '../components/Shell'

export default async function ThankYouPage(){
  const c = await getContent()
  return <main style={styleVars(c)}><SiteNav c={c}/><section className="pageHero"><p className="eyebrow">Thank you</p><h1>Your Yard Loop request was received.</h1><p>We will review your information and follow up. If you need us faster, call or text the number below.</p><div className="heroActions"><a className="btn" href={`tel:${String(c.brand.phone||'').replace(/[^0-9+]/g,'')}`}>Call Yard Loop</a><a className="btn ghost" href="/">Back Home</a></div></section><SiteFooter c={c}/></main>
}
