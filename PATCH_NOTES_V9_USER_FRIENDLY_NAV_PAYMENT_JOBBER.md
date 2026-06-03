# Yard Loop V9 Patch — User-Friendly CRM Navigation, Payment Warning, Jobber-Ready Fields

Applied to: `Yard_Loop_BACKEND_CRM_OPERATIONS_V8_AUDIT_HARDENING_PATCH(2).zip`

## What changed

### 1. CRM / Rep Command Center navigation made easier
The long left-side page list on `/rep` was replaced with grouped navigation:

- Dashboard button
- Pages dropdown:
  - Neighborhood Page
  - Estimate Page
  - Approval Page
  - Leads Page
  - Customers Page
  - Jobs Page
- Settings dropdown:
  - Contractors Page
  - Capacity Page
  - Pricing Page
  - Users Page
  - Reports Page
  - Documents Page
  - Integrations Page
  - Training Page
  - Settings Page

A mobile quick-jump navigation bar was also added at the top of the main CRM area so the user does not need to scroll through a long menu on smaller screens.

### 2. Estimate submission payment warning added
On `/rep`, when a user clicks **Submit Estimate** without one of the following selected:

- ACH enrolled
- Card on file
- Manual invoice approved

The app now shows a browser confirmation warning before allowing the estimate to be submitted.

If the user cancels the warning, the estimate is not submitted and a message says to add ACH, card on file, or manual invoice approval first.

The existing **Signed Contract / Activate** hard block remains in place.

### 3. Jobber-ready integration fields added
The CRM integration settings now include additional Jobber placeholders:

- Jobber home URL
- Jobber quote request URL
- Jobber client hub URL
- Jobber payment method request URL
- Jobber notes

This does not create a live Jobber API sync yet. It makes the ZIP ready to store Jobber links/settings from the admin/CRM side later without rebuilding the site again.

## Files changed

- `app/rep/page.jsx`

## Build check

`npm run build` completed successfully.

Note: Next.js skipped optimizing the Google Fonts stylesheet because the local build environment could not download it. This is a build-environment network warning, not a code failure.
