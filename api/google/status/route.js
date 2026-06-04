export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'
import { googleEnv, googleConfigured, readGoogleToken } from '../../../lib/google'
export async function GET(req){
  const denied=requireAdmin(req); if(denied) return denied
  const env=googleEnv(); const token=await readGoogleToken()
  return NextResponse.json({ok:true,mapsKey:Boolean(env.mapsKey),ga4:Boolean(env.ga4),gtm:Boolean(env.gtm),oauthConfigured:googleConfigured(),oauthConnected:Boolean(token?.access_token),calendarReady:Boolean(googleConfigured()&&token?.access_token),driveReady:Boolean(googleConfigured()&&token?.access_token),sheetsReady:Boolean(googleConfigured()&&token?.access_token),requiredVars:['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY','NEXT_PUBLIC_GA_MEASUREMENT_ID','NEXT_PUBLIC_GTM_ID','GOOGLE_OAUTH_CLIENT_ID','GOOGLE_OAUTH_CLIENT_SECRET','GOOGLE_OAUTH_REDIRECT_URI','GOOGLE_MAPS_SERVER_KEY','GOOGLE_DRIVE_FOLDER_ID','GOOGLE_CALENDAR_ID']},{headers:{'Cache-Control':'no-store'}})
}
