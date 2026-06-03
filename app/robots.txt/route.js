export const dynamic = 'force-dynamic'
import { getContent } from '../lib/content'

export async function GET() {
  const c = await getContent()
  const domain = (c.brand?.domain || 'https://www.yard-loop.com').replace(/\/$/, '')
  const txt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${domain}/sitemap.xml`
  return new Response(txt, {
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=86400' }
  })
}
