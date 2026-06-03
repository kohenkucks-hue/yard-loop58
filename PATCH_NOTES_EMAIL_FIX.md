# Yard Loop Email Delivery Patch

This patch keeps the existing working site structure and changes only the email notification path.

## What changed
- Customer/contact, estimator, and contractor submissions still POST to `/api/lead`.
- `/api/lead` now sends every submission through Resend to `info@yard-loop.com`.
- Added support for `RESEND_API_KEY`, `RESEND_KEY`, or `NEXT_RESEND_API_KEY`.
- Added fallback sender `Yard Loop Leads <onboarding@resend.dev>` so Resend setup can be tested before the yard-loop.com sending domain is verified.
- Added `/api/email-test` so you can test the email route directly after deployment.
- The API now reports exact Resend errors instead of silently acting like everything worked.

## Required Vercel environment variable
Add this in Vercel Project → Settings → Environment Variables:

`RESEND_API_KEY = your Resend API key`

Recommended after verifying your domain in Resend:

`RESEND_FROM_EMAIL = Yard Loop Leads <leads@yard-loop.com>`

## Test after deployment
Open:

`https://www.yard-loop.com/api/email-test`

If it says `ok: true`, the site successfully sent a test email to `info@yard-loop.com`.

If it says missing API key or Resend rejected it, the code is working but Vercel/Resend setup still needs correction.
