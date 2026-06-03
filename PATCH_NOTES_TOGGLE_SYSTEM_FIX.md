# Yard Loop Patch - Toggle System Fix

This patch keeps the working email delivery code and fixes the public page toggle behavior.

## Fixed
- Hidden pages now become `published` when their public toggle is turned ON.
- Turning a page ON also makes it available in navigation when the nav toggle is ON.
- Turning a page OFF changes it to hidden instead of leaving mixed settings behind.
- Estimator OFF now disables:
  - `/estimate` visibility
  - estimator module
  - Get My Plan mode
  - homepage/final CTA plan buttons
  - desktop navigation plan pill
  - mobile navigation plan button
- Estimator ON restores the live calculator page and Get My Plan buttons.
- Contractor page ON restores published state and navigation visibility.
- Email delivery fix from the prior patch remains in place.

## After Deploy
1. Open Admin.
2. Go to Page Toggles / Pages.
3. Toggle Estimator OFF, Save to Blob, refresh the live website.
4. Toggle any hidden page ON, Save to Blob, refresh the live website.
