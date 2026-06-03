export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getContent, styleVars, isVisible } from '../lib/content'
import { SiteNav, SiteFooter, HiddenPage, PageHero } from '../components/Shell'
import EstimatorClient from './EstimatorClient'

export default async function EstimatePage(){
 const c=await getContent(); if(!isVisible(c,'estimate')) return <HiddenPage c={c} name="Estimator" />
 return <main style={styleVars(c)}><SiteNav c={c}/><PageHero c={c} pageKey='pricing' eyebrow='Estimator' headline={c.estimator?.headline || 'Yard Loop Estimator'} subtext={c.estimator?.subheadline || 'Internal pricing calculator and plan builder.'} /><EstimatorClient c={c}/><SiteFooter c={c}/></main>
}
