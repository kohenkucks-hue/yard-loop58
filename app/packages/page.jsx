export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getContent, styleVars, isVisible } from '../lib/content'
import { SiteNav, SiteFooter, HiddenPage } from '../components/Shell'
export default async function Page(){ const c=await getContent(); if(!isVisible(c,'packages')) return <HiddenPage c={c} name="Packages"/>; return <main style={styleVars(c)}><SiteNav c={c}/><section className="pageHero"><p className="eyebrow">Yard Loop module</p><h1>Packages</h1><p>This module is turned on from admin and ready to customize for Yard Loop operations.</p></section><section className="section center"><h2>Packages is active.</h2><p className="lead">Edit this module text, visibility, and launch status from the admin dashboard.</p></section><SiteFooter c={c}/></main> }
