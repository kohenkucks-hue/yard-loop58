export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getContent, styleVars, isVisible } from '../lib/content'
import { SiteNav, SiteFooter, HiddenPage, PageHero } from '../components/Shell'
import GetMyPlanClient from './GetMyPlanClient'

export default async function GetMyPlanPage(){
  const c=await getContent()
  if(!isVisible(c,'getMyPlan')) return <HiddenPage c={c} name="Get My Plan" />
  return <main style={styleVars(c)}><SiteNav c={c}/><PageHero c={c} pageKey='getMyPlan' eyebrow={c.getMyPlan?.heroEyebrow || 'Get My Plan'} headline={c.getMyPlan?.heroHeadline || c.estimator?.headline} subtext={c.getMyPlan?.heroSubtext || c.estimator?.subheadline}/><GetMyPlanClient c={c}/><SiteFooter c={c}/></main>
}
