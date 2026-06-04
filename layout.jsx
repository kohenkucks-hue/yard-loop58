export const dynamic = 'force-dynamic'
import './style.css'
import { getContent } from './lib/content'
import { StyleInjector } from './components/Shell'
import Script from 'next/script'

export async function generateMetadata() {
  try {
    const c = await getContent()
    const domain = (c.brand?.domain || 'https://www.yard-loop.com').replace(/\/$/, '')
    const title = c.seo?.title || `${c.brand?.name} | One Plan. All Year. Total Peace of Mind.`
    const description = c.seo?.description || `Yard Loop provides managed exterior home maintenance subscriptions — mowing, gutters, windows, washing, mulch, and more — organized into one simple monthly plan for Omaha and Council Bluffs homeowners.`
    return {
      title,
      description,
      metadataBase: new URL(domain),
      openGraph: {
        title,
        description,
        url: domain,
        siteName: c.brand?.name || 'Yard Loop',
        type: 'website',
        locale: 'en_US',
        images: [{ url: '/yard-loop-logo.png', width: 1200, height: 630, alt: 'Yard Loop' }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/yard-loop-logo.png'],
      },
      icons: {
        icon: [{ url: '/favicon.ico' }, { url: '/favicon.png', type: 'image/png' }],
        apple: '/favicon.png',
        shortcut: '/favicon.ico',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large' }
      },
      alternates: { canonical: domain }
    }
  } catch {
    return {
      title: 'Yard Loop | One Plan. All Year. Total Peace of Mind.',
      description: 'Managed exterior home maintenance subscriptions for Omaha and Council Bluffs homeowners.',
      icons: { icon: '/favicon.ico', apple: '/favicon.png' },
    }
  }
}

export default async function RootLayout({ children }) {
  const content = await getContent()
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#071a2f" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta property="og:image" content="/yard-loop-logo.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
            <Script id="yard-loop-ga4" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
            `}</Script>
          </>
        ) : null}
        {process.env.NEXT_PUBLIC_GTM_ID ? (
          <Script id="yard-loop-gtm" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
          `}</Script>
        ) : null}
      </head>
      <body>
        <StyleInjector c={content} />
        {children}
      </body>
    </html>
  )
}
