# Yard Loop Patch Notes — Get My Plan Packages, Terms, Image Controls

Base ZIP used: `Yard_Loop_PATCH_Separate_GetMyPlan_Estimator_ServiceBank(1).zip`

## What changed

### Get My Plan page
- Added 4 package choices:
  - Essential Plan
  - Premium Plan
  - Total Peace of Mind Plan
  - Customize My Plan
- Each preset package lists every included service explicitly.
- No prices, monthly totals, point totals, or dollar amounts are shown on the Get My Plan page.
- The custom service picker only appears after `Customize My Plan` is selected.
- Added an `Already have mowing covered?` box with a checkbox to request mowing removal from the selected package.
- Added required terms/cancellation acknowledgement before submit.
- Added expandable cancellation policy language.
- Lead submission now includes selected package, selected services, mowing-removal request, and terms acknowledgement in the existing lead payload.

### Admin
- Added editable Get My Plan wording for package section, mowing-removal section, terms checkbox, terms summary, and cancellation policy.
- Added editable package cards under Get My Plan / Pricing.
- Added safe image crop/position controls under Brand & Design:
  - Default crop position for website images
  - Homepage hero image crop position
  - Show/hide homepage hero blue image box / overlay card

### Styling
- Added styles for plan package cards, mowing-removal box, terms box, required checkbox, and image crop positioning.
- Added homepage hero clean mode when the hero image box is turned off.

## What was intentionally not changed
- No estimator price logic changes.
- No service bank pricing changes.
- No email system changes.
- No Vercel Blob save logic changes.
- No API route changes.
- No contractor/customer page functional changes.
- No full redesign.

## Validation note
A full Next.js build was attempted, but the uploaded ZIP did not contain usable installed Next.js binaries inside `node_modules/.bin`, and dependency installation timed out in the sandbox. The patch was limited to source files and CSS. Deploying to Vercel should run dependency installation normally from `package.json` and `package-lock.json`.
