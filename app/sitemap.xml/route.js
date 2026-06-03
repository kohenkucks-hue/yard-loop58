export const dynamic = 'force-dynamic'
import { getContent } from '../lib/content'

export async function GET() {
  const c = await getContent()
  const domain = (c.brand?.domain || 'https://www.yard-loop.com').replace(/\/$/, '')
  const pages = [
    { url: '/', priority: '1.0', freq: 'weekly' },
    { url: '/services', priority: '0.9', freq: 'monthly' },
    { url: '/how-it-works', priority: '0.8', freq: 'monthly' },
    { url: '/pricing', priority: '0.8', freq: 'monthly' },
    { url: '/estimate', priority: '0.9', freq: 'weekly' },
    { url: '/gallery', priority: '0.7', freq: 'monthly' },
    { url: '/contact', priority: '0.8', freq: 'monthly' },
    { url: '/contractor', priority: '0.7', freq: 'monthly' },
    { url: '/legal', priority: '0.4', freq: 'yearly' },
  ]
  const now = new Date().toISOString().split('T')[0]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${domain}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' }
  })
}
