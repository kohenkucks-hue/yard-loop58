export default function manifest() {
  return {
    name: 'Yard Loop Command Center',
    short_name: 'Yard Loop',
    description: 'Yard Loop public website, admin, rep portal, CRM, estimates, contracts, billing status, reviews, gallery, and Jobber sync framework.',
    start_url: '/rep',
    scope: '/',
    display: 'standalone',
    background_color: '#071a2f',
    theme_color: '#071a2f',
    icons: [
      { src: '/yard-loop-icon.png', sizes: '192x192', type: 'image/png' },
      { src: '/yard-loop-icon.png', sizes: '512x512', type: 'image/png' }
    ]
  }
}
