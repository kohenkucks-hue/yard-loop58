export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../lib/adminAuth'

function present(name){ return Boolean(process.env[name]) }
function modeFor(name){ const v=process.env[name]||''; if(v.includes('_live_')) return 'live'; if(v.includes('_test_')) return 'test'; return v ? 'configured' : 'missing' }

const providers = {
  jobber:{
    vars:['JOBBER_CLIENT_ID','JOBBER_CLIENT_SECRET','JOBBER_REDIRECT_URL'],
    routes:['/api/jobber/connect','/api/jobber/callback','/api/jobber/status','/api/jobber/test','/api/jobber/sync-lead'],
    note:'OAuth and GraphQL route foundation is present. Test with Jobber sandbox/test app before production.'
  },
  payments:{
    vars:['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET'],
    publicVars:['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
    routes:['/api/stripe/checkout','/api/stripe/webhook'],
    note:'Checkout and webhook foundation is present. Use Stripe test keys until verified.'
  },
  google:{
    vars:['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY','GOOGLE_OAUTH_CLIENT_ID','GOOGLE_OAUTH_CLIENT_SECRET','GOOGLE_OAUTH_REDIRECT_URI'],
    publicVars:['NEXT_PUBLIC_GA_MEASUREMENT_ID'],
    optionalVars:['NEXT_PUBLIC_GTM_ID','GOOGLE_MAPS_SERVER_KEY','GOOGLE_DRIVE_FOLDER_ID','GOOGLE_CALENDAR_ID'],
    routes:['GA4 script in app/layout.jsx','Google map embed on contact page','CRM address autocomplete on estimate Info tab','CRM Verify Location reverse-geocode','CRM Google Maps preview','CRM Route Map tab','CRM Neighborhood canvassing map','CRM Street View preview','/api/google/oauth/start','/api/google/callback','/api/google/status','/api/google/calendar/create-event','/api/google/drive/backup','/api/google/sheets/export'],
    note:'Maps, Places, Geocoder, Street View, Route Map, Directions route optimization, Calendar events, Drive backup, and Sheets export are wired. They activate when Google Cloud APIs and Vercel variables are configured.'
  },
  email:{
    vars:['RESEND_API_KEY','NOTIFY_EMAIL','RESEND_FROM_EMAIL','REPLY_TO_EMAIL'],
    optionalVars:['EMAIL_FROM','LEAD_NOTIFY_EMAIL'],
    routes:['/api/lead','/api/email-test','/api/notify'],
    note:'Resend lead email path remains live.'
  },
  sms:{
    vars:['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_FROM_NUMBER'],
    routes:['/api/twilio/send'],
    note:'Admin-only SMS send route exists and requires consentConfirmed=true. Keep disabled until SMS consent language/phone setup are ready.'
  },
  quickbooks:{
    vars:['QUICKBOOKS_CLIENT_ID','QUICKBOOKS_CLIENT_SECRET','QUICKBOOKS_REDIRECT_URL'],
    routes:['/api/quickbooks/status'],
    note:'Status scaffold only. Full OAuth/sync should be built after Jobber and Stripe are stable.'
  }
}

export async function GET(req){
  const denied = requireAdmin(req)
  if(denied) return denied
  const result = {}
  for(const [name,info] of Object.entries(providers)){
    const allVars = [...(info.vars||[]), ...(info.publicVars||[])]
    result[name] = {
      required: allVars.length,
      configured: allVars.filter(present).length,
      missing: allVars.filter(v=>!present(v)),
      routes: info.routes,
      mode: name === 'payments' ? modeFor('STRIPE_SECRET_KEY') : undefined,
      note: info.note,
      secretValuesHidden:true,
    }
  }
  return NextResponse.json({ ok:true, providers:result, note:'Secret values are never returned. This endpoint only reports configured/missing status and route readiness.' }, { headers:{'Cache-Control':'no-store'} })
}
