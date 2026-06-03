export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getContent, styleVars, isVisible } from '../lib/content'
import { SiteNav, SiteFooter, HiddenPage, PageHero } from '../components/Shell'
import ContactClient from '../contact/ContactClient'

export default async function Page(){
  const c=await getContent();
  if(!isVisible(c,'customer')) return <HiddenPage c={c} name="Customer"/>;
  return <main style={styleVars(c)}><SiteNav c={c}/>
    <PageHero c={c} pageKey="contact" eyebrow="Customer request" headline="Customer / client request" subtext="Send Yard Loop a customer request, service question, or plan note." />
    <ContactClient c={c} source="Customer / Client Page" />
    <SiteFooter c={c}/>
  </main>
}
