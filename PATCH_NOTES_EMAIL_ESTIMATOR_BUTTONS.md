# Yard Loop Patch - Email, Estimator, Plan Buttons, Contractor Desktop

Applied to: Yard_Loop_SAFE_Official_Brand_Redesign_Image_Admin(4).zip

## What changed
- Lead/customer/contact forms continue posting to `/api/lead` and email through Resend.
- Resend notifications now always include `info@yard-loop.com` as a required recipient, even if another admin notification email is configured.
- Customer / Client page now has a working request form that sends through the same lead + Resend flow.
- Get My Plan defaults to the live instant estimator/calculator instead of the softer custom request mode.
- Existing saved CMS content is safely migrated so the estimator remains published and the instant calculator is forced on for this patch.
- Added an admin switch under Get My Plan / Pricing: “Show big Get My Plan buttons.”
- That switch controls the large homepage, pricing, final CTA, and top nav pill plan buttons without hiding the estimator page itself.
- Contractor Partners is now set to appear in desktop navigation when the contractor page is visible.

## What was not changed
- No core Blob storage logic was removed.
- No lead dashboard storage logic was removed.
- No design system or major page structure was rewritten.

## Deploy reminder
Make sure Vercel Environment Variables include:
- `RESEND_API_KEY`
- `NOTIFY_EMAIL=info@yard-loop.com` recommended
- `RESEND_FROM_EMAIL` should use a verified sender/domain in Resend
