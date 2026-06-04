export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getContent, styleVars, isVisible } from '../lib/content'
import { SiteNav, SiteFooter, HiddenPage, PageHero } from '../components/Shell'
import CustomerPortalClient from './CustomerPortalClient'
export default async function Page({searchParams}){ const c=await getContent(); if(!isVisible(c,'customer')) return <HiddenPage c={c} name="Customer"/>; return <main style={styleVars(c)}><SiteNav c={c}/><PageHero c={c} pageKey="customer" eyebrow="Customer portal" headline="Your Yard Loop plan" subtext="View your plan, services, schedule, and account requests."/><CustomerPortalClient initialToken={searchParams?.token||''}/><SiteFooter c={c}/></main> }
