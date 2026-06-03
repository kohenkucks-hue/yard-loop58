export const dynamic = 'force-dynamic'
export const revalidate = 0
import Link from 'next/link'
import { getContent, styleVars, isVisible } from './lib/content'
import { SiteNav, SiteFooter, Img, arr, FinalCta } from './components/Shell'
import LogoImg from './components/LogoImg'

export default async function Home(){
 const c=await getContent(); const estOn=isVisible(c,'getMyPlan'); const showPlanButtons = c.getMyPlan?.showButtons !== false && c.modules?.showPlanButtons !== false
 const fallbackPackages = [
  {name:'Essential Plan', services:['Lawn Mowing','Spring Cleanup','Fall Cleanup']},
  {name:'Premium Plan', services:['Lawn Mowing','Spring Cleanup','Fall Cleanup','Fertilizer & Weed Control','Core Aeration','Exterior Pest & Insect Control']},
  {name:'Total Peace of Mind Plan', services:['Lawn Mowing','Spring Cleanup','Fall Cleanup','Fertilizer & Weed Control','Core Aeration','Exterior Pest & Insect Control','Mulch Refresh','Shrub Trimming','Gutter Cleaning','Window Cleaning','House Wash','Driveway / Concrete Wash','Deck / Patio Wash']},
  {name:'Customize My Plan', services:['Build your own plan by selecting only the services you want included.']}
 ]
 const homePackages = ((c.getMyPlan?.packages?.length ? c.getMyPlan.packages : fallbackPackages) || []).filter(pkg=>pkg.enabled!==false)
 return <main style={styleVars(c)}><SiteNav c={c}/>
  <section id="main-content" className="hero" style={c.hero.backgroundImage ? {backgroundImage:`linear-gradient(100deg,rgba(12,34,63,.72),rgba(12,34,63,.38)),url(${c.hero.backgroundImage})`, backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat'} : undefined}>
   <div className="heroText"><h1>{c.hero.headline}</h1><LogoImg className="heroBrandLogo" src="/yard-loop-logo.png" alt="Yard Loop" fallback="/yard-loop-badge-official.jpeg"/><p className="heroIntro">{c.hero.eyebrow}</p><p className="subhead">{c.hero.subheadline}</p><div className="actions">{showPlanButtons && <Link className="btn large" href={estOn?'/get-my-plan':'/contact'}>{c.hero.primaryCta}</Link>}<Link className="btn ghost large" href="/how-it-works">{c.hero.secondaryCta}</Link></div><div className="trustLine">{arr(c.trust).map((t,i)=><span key={i}>✓ {t}</span>)}</div></div>
   <div className={c.imageControls?.showHeroImageBox===false?'heroCard cleanHeroCard':'heroCard'}><Img src={c.hero.image} label="Yard Loop service"/>{c.imageControls?.showHeroImageBox!==false&&<div className="floatCard"><b>{c.hero.overlayTitle}</b>{arr(c.hero.overlayItems).map((x,i)=><span key={i}>{x}</span>)}</div>}</div>
  </section>
  <section className="section pain"><h2>{c.painHeadline}</h2><div className="grid4">{arr(c.problem).map((p,i)=><div className="mini" key={i}>{p}</div>)}</div></section>
  <section className="section split"><div><p className="eyebrow">The Yard Loop model</p><h2>{c.splitHeadline}</h2><p className="lead">{c.splitText}</p>{showPlanButtons && estOn && <Link className="btn" href="/get-my-plan">Get My Plan →</Link>}</div><div className="stack">{arr(c.promise).map((p,i)=><article className="feature" key={i}><Img src={p.image} label={p.title}/><div><h3>{p.title}</h3><p>{p.text}</p></div></article>)}</div></section>
  <section className="section muted"><p className="eyebrow">How Yard Loop Works</p><h2>{c.pointPricing?.headline}</h2><div className="steps">{arr(c.pointPricing?.steps).map((s,i)=><article key={i}><b>{s.num}</b><h3>{s.title}</h3><p>{s.text}</p></article>)}</div></section>
  <section className="section"><p className="eyebrow">What can be included</p><h2>Complete exterior home maintenance, organized into one plan.</h2><div className="cards">{arr(c.included).filter(x=>x.enabled!==false).map((s,i)=><article className="card" key={i}><Img src={s.image} label={s.title}/><h3>{s.icon} {s.title}</h3><p>{s.text}</p></article>)}</div></section>
  <section className="band"><p className="eyebrow light">How it works</p><h2>Simple outside. Organized underneath.</h2><div className="steps">{arr(c.how).map((h,i)=><article key={i}><b>{h.step}</b><h3>{h.title}</h3><p>{h.text}</p></article>)}</div></section>
  <section className="section pricingBlock"><div><p className="eyebrow">Pricing</p><h2>{c.pricing.headline}</h2><p>{c.pricing.text}</p><div className="priceRange"><span>{c.pricing.rangeLabel}</span><strong>{c.pricing.rangeValue}</strong><small>{c.pricing.rangeNote}</small></div><p className="fine">{c.pricing.note}</p></div><aside><h3>Yard Loop Packages</h3><div className="homePackageList">{homePackages.map(pkg=><article className="homePackage" key={pkg.name}><h4>{pkg.name}</h4><ul>{pkg.services.map(service=><li key={service}>✓ {service}</li>)}</ul></article>)}</div>{showPlanButtons && estOn && <Link className="btn" href="/get-my-plan">Get My Plan</Link>}</aside></section>
  {arr(c.testimonials).filter(t=>t.enabled&&t.quote).length>0 && <section className="testimonials"><p className="eyebrow">Reviews</p><h2>What homeowners say.</h2><div className="testimCards">{arr(c.testimonials).filter(t=>t.enabled&&t.quote).map((t,i)=><div className="testimCard" key={i}><div className="stars">★★★★★</div><blockquote>“{t.quote}”</blockquote><cite>{t.name}<small>{t.location}</small></cite></div>)}</div></section>}
  {showPlanButtons && estOn && <FinalCta c={c}/>}<SiteFooter c={c}/></main>
}
