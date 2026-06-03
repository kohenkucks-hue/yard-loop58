# Yard Loop V28 Google CRM Patch

This patch turns the previous Google placeholders into usable CRM tools.

## Added
- Google Places address autocomplete on the CRM Estimate → Info tab.
- Verify Location button now uses Google Maps Geocoder when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set.
- Verify Location can reverse-geocode current browser GPS into address/city/state/ZIP.
- Address selection fills: address, city, state, country, ZIP, formattedAddress, Google place ID, latitude, longitude, verification timestamp.
- Google map preview appears inside the Estimate Info tab after an address is entered/verified.
- Open in Google Maps link appears for the selected service address.
- Integration status now lists CRM Google autocomplete, reverse geocode, and map preview readiness.
- CSP updated for Google Maps JavaScript API and Google Maps iframe preview.

## Required Vercel env var
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=`

In Google Cloud Console, enable:
- Maps JavaScript API
- Places API
- Geocoding API
- Maps Embed API

Recommended key restrictions:
- HTTP referrers: `https://www.yard-loop.com/*` and your Vercel preview domain while testing.
- API restrictions: the four APIs listed above.

## Still intentionally future-scope
- Google Drive document sync
- Google Calendar sync
- Full Google OAuth connection

Those variables remain reserved in `.env.example` but should be added only after Jobber/Stripe/Blob/Resend are stable.
