import Link from 'next/link'
import MobileNav from './MobileNav'
import { publicPages, isVisible } from '../lib/content'


export function StyleInjector({ c }) {
  const b = c?.brand || {}
  const bg = c?.bgColors || {}
  const ts = c?.textStyles || {}
  const ic = c?.imageControls || {}
  const hFont = b.headingFont || 'Outfit'
  const bFont = b.bodyFont || 'DM Sans'
  const allFonts = [...new Set([hFont, bFont, ...Object.values(ts).map(s=>s?.font).filter(Boolean)])]
  const googleUrl = 'https://fonts.googleapis.com/css2?family=' +
    allFonts.map(f => f.replace(/ /g, '+') + ':wght@400;500;600;700;800;900').join('&family=') + '&display=swap'

  // Every color in the palette becomes a CSS variable
  const vars = [
    // Core brand palette
    b.primary         && `--navy:${b.primary}`,
    b.green           && `--green:${b.green}`,
    b.lime            && `--lime:${b.lime}`,
    b.gold            && `--gold:${b.gold}`,
    b.cream           && `--cream:${b.cream}`,
    b.ink             && `--ink:${b.ink}`,
    // Fonts
    `--fontHeading:'${hFont}'`,
    `--fontBody:'${bFont}'`,
    // Text color overrides
    b.textHeading     && `--colorHeading:${b.textHeading}`,
    b.textBody        && `--colorBody:${b.textBody}`,
    b.textMuted       && `--colorMuted:${b.textMuted}`,
    b.textOnDark      && `--colorOnDark:${b.textOnDark}`,
    b.textSubOnDark   && `--colorSubOnDark:${b.textSubOnDark}`,
    // Button colors
    b.btnBg           && `--btnBg:${b.btnBg}`,
    b.btnText         && `--btnText:${b.btnText}`,
    b.btnHover        && `--btnHover:${b.btnHover}`,
    // Nav colors
    b.navBg           && `--navBg:${b.navBg}`,
    b.navText         && `--navText:${b.navText}`,
    b.navLinkHover    && `--navLinkHover:${b.navLinkHover}`,
    // Alert bar
    b.alertBg         && `--alertBg:${b.alertBg}`,
    b.alertText       && `--alertText:${b.alertText}`,
    // Footer
    b.footerBg        && `--footerBg:${b.footerBg}`,
    b.footerText      && `--footerText:${b.footerText}`,
    b.footerLink      && `--footerLink:${b.footerLink}`,
    // Section backgrounds
    b.heroBg          && `--heroBg:${b.heroBg}`,
    b.bandBg          && `--bandBg:${b.bandBg}`,
    b.cardBg          && `--cardBg:${b.cardBg}`,
    b.pageBg          && `--pageBg:${b.pageBg}`,
    // Accent / highlight
    b.accent          && `--accent:${b.accent}`,
    b.highlight       && `--highlight:${b.highlight}`,
    b.border          && `--border:${b.border}`,
    `--globalImagePosition:${ic.globalPosition || 'center center'}`,
    `--heroImagePosition:${ic.heroImagePosition || ic.globalPosition || 'center center'}`,
  ].filter(Boolean).join(';')

  // Section background overrides from bgColors panel
  const bgCSS = [
    bg.hero         && `.hero{background:${bg.hero}!important}`,
    bg.pain         && `.pain{background:${bg.pain}!important}`,
    bg.split        && `.split{background:${bg.split}!important}`,
    bg.band         && `.band{background:${bg.band}!important}`,
    bg.pointPricing && `.section.muted{background:${bg.pointPricing}!important}`,
    bg.services     && `.section:not(.pain):not(.split):not(.muted):not(.pricingBlock){background:${bg.services}}`,
    bg.pricing      && `.pricingBlock{background:${bg.pricing}!important}`,
    bg.testimonials && `.testimonials{background:${bg.testimonials}!important}`,
    bg.finalCta     && `.offer,.finalCta{background:${bg.finalCta}!important}`,
    bg.nav          && `.nav{background:${bg.nav}!important}`,
    bg.footer       && `footer{background:${bg.footer}!important}`,
    bg.pageHero     && `.pageHero,.contractorHero{background:${bg.pageHero}!important}`,
    bg.cards        && `.card,.feature,.mini,.miniCard,.stepCard,.serviceCard{background:${bg.cards}!important}`,
    bg.alert        && `.alert{background:${bg.alert}!important}`,
    bg.contactForm  && `.contactForm{background:${bg.contactForm}!important}`,
    bg.gallery      && `.gallerySection{background:${bg.gallery}!important}`,
    bg.estimator    && `.estimatorGrid{background:${bg.estimator}!important}`,
  ].filter(Boolean).join('\n')

  // Per-field text styles from Admin. The old admin saved size/font/color,
  // but the public site only loaded colors in a few places. These selectors
  // apply the saved settings to the live pages. Font-size uses !important
  // because app/style.css has specific section rules and clamp() values.
  const esc = v => String(v || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`')
  const styleRule = (selector, key) => {
    const st = ts?.[key] || {}
    const parts = []
    if (st.color) parts.push(`color:${esc(st.color)}!important`)
    if (st.font) parts.push(`font-family:'${esc(st.font)}',ui-sans-serif,sans-serif!important`)
    if (st.size) parts.push(`font-size:${esc(st.size)}!important`)
    return parts.length ? `${selector}{${parts.join(';')}}` : ''
  }
  const textCSS = [
    styleRule('.heroText > .eyebrow','hero.eyebrow'),
    styleRule('.heroText > h1','hero.headline'),
    styleRule('.heroText > .subhead','hero.subheadline'),
    styleRule('.heroText .actions .btn:first-child','hero.primaryCta'),
    styleRule('.heroText .actions .btn.ghost','hero.secondaryCta'),
    styleRule('.floatCard > b','hero.overlayTitle'),
    styleRule('.pain > h2','painHeadline'),
    styleRule('.split > div:first-child > h2','splitHeadline'),
    styleRule('.split > div:first-child > .lead','splitText'),
    styleRule('.section.muted > .eyebrow','pointPricing.eyebrow'),
    styleRule('.section.muted > h2','pointPricing.headline'),
    ...arr(c.pointPricing?.steps).flatMap((_,i)=>[
      styleRule(`.section.muted .steps article:nth-child(${i+1}) > b`,`pointPricing.steps.${i}.num`),
      styleRule(`.section.muted .steps article:nth-child(${i+1}) > h3`,`pointPricing.steps.${i}.title`),
      styleRule(`.section.muted .steps article:nth-child(${i+1}) > p`,`pointPricing.steps.${i}.text`),
    ]),
    ...arr(c.how).flatMap((_,i)=>[
      styleRule(`.band .steps article:nth-child(${i+1}) > h3`,`how.${i}.title`),
      styleRule(`.band .steps article:nth-child(${i+1}) > p`,`how.${i}.text`),
    ]),
    styleRule('.finalCta h2,.offer h2','finalCta.headline'),
    styleRule('.finalCta p,.offer p','finalCta.text'),
    styleRule('.finalCta .btn,.offer .btn','finalCta.button'),
    styleRule('.pageHero .eyebrow','pageHeroes.services.eyebrow'),
    styleRule('.pageHero h1','pageHeroes.services.headline'),
    styleRule('.pageHero p','pageHeroes.services.subtext'),

    // Home page pain/problem chips
    ...arr(c.problem).map((_,i)=>
      styleRule(`.grid4 .mini:nth-child(${i+1})`,`problem.${i}`)
    ),

    // Home page model/promise cards
    ...arr(c.promise).flatMap((_,i)=>[
      styleRule(`.stack .feature:nth-child(${i+1}) h3`,`promise.${i}.title`),
      styleRule(`.stack .feature:nth-child(${i+1}) p`,`promise.${i}.text`),
    ]),

    // Home page service cards
    ...arr(c.included).flatMap((_,i)=>[
      styleRule(`.cards .card:nth-child(${i+1}) h3`,`included.${i}.title`),
      styleRule(`.cards .card:nth-child(${i+1}) p`,`included.${i}.text`),
    ]),

    // Home page pricing card
    styleRule('.pricingBlock .rangeValue','pricing.rangeValue'),
    styleRule('.pricingBlock p:nth-of-type(1)','pricing.text'),
    styleRule('.pricingBlock p:nth-of-type(2)','pricing.note'),

    // Testimonials / offer
    styleRule('.offer h2','offer.headline'),
    styleRule('.offer p:not(.eyebrow)','offer.text'),
    styleRule('.offer .btn','offer.button'),
  ].filter(Boolean).join('\n')

  const gaId = b.gaId?.trim()
  return <>
    {gaId && <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}/>
      <script dangerouslySetInnerHTML={{__html:`
        window.dataLayer=window.dataLayer||[];
        function gtag(){dataLayer.push(arguments);}
        gtag('js',new Date());
        gtag('config','${gaId}',{page_path:window.location.pathname});
      `}}/>
    </>}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href={googleUrl} rel="stylesheet" />
    <style>{`
      :root{${vars}}

      /* Fonts */
      h1,h2,h3,h4,h5,h6{font-family:var(--fontHeading,'Outfit'),ui-sans-serif,sans-serif;color:var(--colorHeading,var(--navy,#071a2f))}
      b,strong,.eyebrow{font-family:var(--fontHeading,'Outfit'),ui-sans-serif,sans-serif}
      body{font-family:var(--fontBody,'DM Sans'),ui-sans-serif,sans-serif;color:var(--ink,#0d1f30)}

      /* Text colors */
      .subhead,.lead,.feature p,.card p,.faqItem p,.pricingBlock p,.baCaption,.galleryCaption p,
      .contactPage p,.policyCard p,.stepCard p,.miniCard p{color:var(--colorBody,#1e3a4f)}
      .brand small,.baLabel,.formNote,.editCardHint{color:var(--colorMuted,#3a5266)}
      .band h1,.band h2,.pageHero h1,.offer h2,.finalCta h2,
      .contractorHero h1{color:var(--colorOnDark,#ffffff)!important}
      .band p,.steps p,.pageHero p,.offer p,.finalCta p,
      .contractorHero p{color:var(--colorSubOnDark,#d4eaf8)!important}

      /* Buttons */
      .pill,.btn,.saveBtn{background:var(--btnBg,linear-gradient(135deg,var(--green,#2f7d32),var(--lime,#9fd45a)));color:var(--btnText,#fff)}
      .btn.ghost{background:rgba(255,255,255,.84);color:var(--navy,#071a2f)}

      /* Nav */
      .nav{background:var(--navBg,rgba(255,255,255,.97))}
      .navLinks a{color:var(--navText,#0c223f)}
      .navLinks a:hover{color:var(--navLinkHover,var(--green,#2f7d32))}
      .brand b{color:var(--navText,var(--navy,#071a2f))}

      /* Alert */
      .alert{background:var(--alertBg,var(--green,#2f7d32));color:var(--alertText,#fff)}

      /* Footer */
      footer{background:var(--footerBg,#04101d)}
      .footerBrand b,.footerCol h4{color:var(--footerText,#fff)}
      .footerContact a,.footerCol a{color:var(--footerLink,#c8dfe8)}

      /* Cards */
      .card,.feature,.mini,.miniCard,.stepCard,.serviceCard,.policyCard{background:var(--cardBg,rgba(255,255,255,.86))}

      /* Band / dark sections */
      .band{background:var(--bandBg,var(--navy,#071a2f))}

      /* Hero */
      .hero{background:var(--heroBg,radial-gradient(ellipse at 5% 0%,#e3f5d8 0%,#fff 36%,#f3f7fb 100%))}

      /* Accent colors */
      .eyebrow{color:var(--accent,var(--green,#2f7d32))}
      .eyebrow::before{background:var(--accent,var(--green,#2f7d32))}
      .band .eyebrow{color:var(--highlight,var(--lime,#9fd45a))}
      .band .eyebrow::before{background:var(--highlight,var(--lime,#9fd45a))}
      .rangeValue{color:var(--highlight,var(--lime,#9fd45a))}
      .steps b{color:var(--gold,#d9a441)}

      /* Borders */
      .card,.feature,.mini,.miniCard,.stepCard{border-color:var(--border,rgba(7,26,47,.09))}

      ${bgCSS}
      ${textCSS}
    `}</style>
  </>
}


export function arr(x){ return Array.isArray(x) ? x : [] }
export function money(n){ return `$${Number(n || 0).toLocaleString()}` }
export function phoneHref(phone=''){ return 'tel:' + String(phone).replace(/[^0-9+]/g,'') }

export function Img({ src, label, className='' }){
  const cleanSrc = typeof src === 'string' ? src.trim() : ''
  if(cleanSrc) return <img className={`ylUploadedImg ${className}`.trim()} src={cleanSrc} alt={label || ''} loading="lazy" decoding="async" />
  return <div className={`imgPh ${className}`}>{label || 'Add image in admin'}</div>
}

export function SiteNav({ c }){
  const links = publicPages(c)
  const showPlanButtons = c.getMyPlan?.showButtons !== false && c.modules?.showPlanButtons !== false && isVisible(c,'getMyPlan')
  return <>
    {c.alertEnabled !== false && c.alert && <div className="alert" role="banner">{c.alert}</div>}
    <header className="nav brandNav">
      <Link className="brand officialBrand" href="/">
        <img className="officialWordmark" src="/yard-loop-logo.png" alt="Yard Loop"/>
        <span className="brandCopy"><b>{c.brand.name}</b><small>{c.brand.tagline}</small></span>
      </Link>
      <nav className="navLinks" aria-label="Main navigation">
        {links.filter(l=>l.key!=='getMyPlan').map(l => <Link href={l.href} key={l.key} prefetch={true}>{l.label}</Link>)}
        {showPlanButtons && <Link className="pill" href="/get-my-plan" prefetch={true}>Get My Plan</Link>}
      </nav>
      <MobileNav links={links} c={c}/>
    </header>
  </>
}

export function SiteFooter({ c }){
  const links = publicPages(c)
  const socialLinks = (c.socialLinks||[]).filter(x=>x.enabled&&x.url)
  const linkUrl = url => String(url||'').startsWith('http') ? url : `https://${url}`
  return <footer>
    <div className="footerGrid">
      <div className="footerBrand">
        <div className="footerLogo officialFooterLogo"><img className="footerWordmark" src="/yard-loop-logo.png" alt="Yard Loop"/></div>
        <img className="footerBadgeLogo" src="/yard-loop-badge-official.jpeg" alt="Yard Loop badge"/>
        <p>{c.brand.tagline}</p>
        <div className="footerContact">
          {c.brand.phone&&<a href={phoneHref(c.brand.phone)}>{c.brand.phone}</a>}
          {c.brand.email&&<a href={`mailto:${c.brand.email}`}>{c.brand.email}</a>}
          {c.brand.ownerEmail&&<a href={`mailto:${c.brand.ownerEmail}`}>Owner: {c.brand.ownerEmail}</a>}
          {c.brand.supportEmail&&<a href={`mailto:${c.brand.supportEmail}`}>Support: {c.brand.supportEmail}</a>}
          {c.brand.domain&&<a href={c.brand.domain.startsWith('http')?c.brand.domain:`https://${c.brand.domain}`} target="_blank" rel="noreferrer">{c.brand.domain.replace(/^https?:\/\//,'')}</a>}
          {c.brand.serviceArea&&<span>{c.brand.serviceArea}</span>}
          {c.brand.address&&<span>{c.brand.address}</span>}
        </div>
      </div>
      <div className="footerCol"><h4>Pages</h4>{links.slice(0,8).map(l => <Link href={l.href} key={l.key}>{l.label}</Link>)}{isVisible(c,'legal') && <><Link href="/legal#terms-of-service">Terms of Service</Link><Link href="/legal#cancellation-policy">Cancellation Policy</Link><Link href="/legal#privacy-policy">Privacy Policy</Link></>}<Link href="/admin">Admin Login</Link></div>
      <div className="footerCol"><h4>Get Started</h4>{isVisible(c,'getMyPlan') && <Link href="/get-my-plan">Get My Plan</Link>}<Link href="/contact">Talk With Yard Loop</Link><a href={phoneHref(c.brand.phone)}>Call Us</a>{isVisible(c,'contractor') && <Link href="/contractor">Contractor Partners</Link>}{c.googleReviewUrl && <a href={c.googleReviewUrl} target="_blank" rel="noreferrer">⭐ Leave a Google Review</a>}</div>
      <div className="footerCol"><h4>Social</h4>{socialLinks.length?socialLinks.map(x=><a key={x.label} href={linkUrl(x.url)} target="_blank" rel="noreferrer">{x.label}</a>):<span style={{color:'var(--footerLink,#c8dfe8)',opacity:.8,fontSize:14}}>Social links can be added in admin.</span>}</div>
    </div>
    <div className="footerBottom"><span>© {new Date().getFullYear()} {c.brand.name}. All rights reserved.</span><span>{c.brand.domain}</span></div>
  </footer>
}

export function PageHero({ c, pageKey, eyebrow, headline, subtext }){
  const ph = c?.pageHeroes?.[pageKey] || {}
  const img = ph.image || c?.brand?.badgeLogo || ''
  return <section className="pageHero brandedPageHero">
    <div className="pageHeroCopy"><p className="eyebrow">{ph.eyebrow || eyebrow}</p><h1>{ph.headline || headline}</h1><p>{ph.subtext || subtext || ''}</p></div>
    {img && <img className="pageHeroBadge" src={img} alt={`${c?.brand?.name || 'Yard Loop'} brand`}/>}
  </section>
}

export function FinalCta({ c }){
  if(c.getMyPlan?.showButtons === false || c.modules?.showPlanButtons === false || !isVisible(c,'estimate')) return null
  return <section className="offer brandedOffer">{c.brand?.badgeLogo && <img className="ctaBadgeLogo" src={c.brand.badgeLogo} alt={`${c.brand.name} badge`}/>}<p className="eyebrow light">Next step</p><h2>{c.finalCta?.headline}</h2><p>{c.finalCta?.text}</p><Link className="btn" href="/estimate">{c.finalCta?.button}</Link></section>
}

export function HiddenPage(){
  return <main style={{padding:'80px 7vw',fontFamily:'system-ui'}}><h1>Page not active</h1><p>This Yard Loop module is currently hidden.</p></main>
}
