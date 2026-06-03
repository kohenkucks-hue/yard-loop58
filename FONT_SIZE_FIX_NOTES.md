# Yard Loop Font Size Fix Notes

This ZIP fixes the admin font size controls.

## What was wrong
The admin panel was saving textStyles like color, font, and size into Blob, but the public website only applied the color/font in limited places. The saved font size was not being translated into live CSS selectors, so changing the size in admin did not visually change the website.

## What was fixed
- Added live CSS generation for saved admin text styles.
- Font size now uses `!important` so it overrides the existing theme CSS/clamp rules.
- Applied admin style controls to the main homepage sections:
  - Hero eyebrow
  - Hero headline
  - Hero subheadline
  - Hero buttons
  - Hero floating card title
  - Pain section headline
  - Yard Loop model headline/body
  - Point pricing headline/steps
  - How-it-works steps
  - Final CTA headline/body/button
- Removed duplicate admin password input field.
- Cleaned invalid `next.config.js` experimental warning.

## After deploying
1. Go to `/admin`.
2. Change a font size on one obvious field like Hero headline.
3. Click Save to Blob.
4. Refresh the homepage.
5. If needed, open in a private/incognito tab to bypass browser cache.
