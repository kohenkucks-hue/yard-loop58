export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getContent, styleVars, isVisible } from '../lib/content'
import { SiteNav, SiteFooter, HiddenPage, PageHero } from '../components/Shell'
import ContractorApplication from './ContractorApplication'

export default async function Page(){
  const c=await getContent();
  if(!isVisible(c,'contractor')) return <HiddenPage c={c} name="Contractor"/>;
  const k = c.contractor || {};
  return <main style={styleVars(c)}><SiteNav c={c}/>
    <PageHero c={c} pageKey="contractor" eyebrow={k.heroEyebrow || 'Contractor partners'} headline={k.heroHeadline || 'Partner With Yard Loop'} subtext={k.heroSubtext || 'Join a growing exterior home maintenance platform serving the Omaha & Council Bluffs metro.'} />
    <div className="contractorHeroActions"><a className="btn" href="#contractor-application">Apply to Partner</a><a className="btn ghost" href={`mailto:${c.brand.email}`}>Ask a Question</a></div>
    <section className="section split2">
      <div><p className="eyebrow">Why partner</p><h2>{k.benefitsHeadline}</h2><p className="lead">{k.benefitsText}</p></div>
      <div className="cardGrid smallCards">{(k.benefits||[]).map((x,i)=><article className="miniCard" key={i}><h3>{x.title}</h3><p>{x.text}</p></article>)}</div>
    </section>
    <section className="section tinted"><p className="eyebrow">How the partnership works</p><h2>{k.howHeadline}</h2><div className="stepsGrid">{(k.how||[]).map((x,i)=><article className="stepCard" key={i}><span>{String(i+1).padStart(2,'0')}</span><h3>{x.title}</h3><p>{x.text}</p></article>)}</div></section>
    <section className="section"><p className="eyebrow">Yard Loop standards</p><h2>{k.expectationsHeadline}</h2><div className="cardGrid">{(k.expectations||[]).map((x,i)=><article className="serviceCard" key={i}><h3>{x.title}</h3><p>{x.text}</p></article>)}</div></section>
    <section className="section split2">
      <div className="policyCard"><h2>{k.insuranceHeadline}</h2>{(k.insuranceBullets||[]).map((x,i)=><p key={i}>✅ {x}</p>)}<p className="finePrint">{k.independentContractorText}</p></div>
      <div className="policyCard"><h2>{k.payHeadline}</h2><p>{k.payText}</p>{(k.payBullets||[]).map((x,i)=><p key={i}>✅ {x}</p>)}<p className="finePrint">{k.payDisclaimer}</p></div>
    </section>
    <section className="section tinted"><h2>{k.qualityHeadline}</h2><p className="lead">{k.qualityText}</p><div className="pillRow">{(k.qualityPills||[]).map(p=><span key={p}>{p}</span>)}</div></section>
    {k.snowHeadline && <section className="section tinted"><p className="eyebrow">Winter operations</p><h2>{k.snowHeadline}</h2><p className="lead">{k.snowText}</p><div className="pillRow">{(k.snowRules||[]).map(p=><span key={p}>{p}</span>)}</div></section>}
    <section className="section" id="contractor-application"><p className="eyebrow">Contractor application</p><h2>{k.application?.headline}</h2><p className="lead">{k.application?.subheadline}</p><ContractorApplication c={c}/></section>
    <SiteFooter c={c}/></main>
}
