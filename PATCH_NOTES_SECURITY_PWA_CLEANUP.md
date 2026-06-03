# Yard Loop Rep Portal Security + PWA Cleanup

Applied after external code review.

## Fixed
- Removed `prompt()` and `confirm()` browser dialogs from the Rep Portal and replaced them with an iOS/PWA-friendly inline modal.
- Removed backup files from `app/rep/` (`.bak` and `.pre_big_patch`).
- Removed hardcoded cloud/admin password fallbacks from API routes. Cloud saves now require `ADMIN_PASSWORD` to be set in Vercel.
- Masked PIN display in User Management.
- Changed Add User PIN entry to a password field.
- Changed sensitive integration fields such as API keys, client secrets, webhook secrets, auth tokens, and account SIDs to password inputs.
- Added a Rep Portal photo size guard so localStorage test mode does not silently break from large base64 photos.
- Replaced direct public cloud export link with password-protected export button.
- Protected Rep Portal cloud data API from exposing saved CRM data without the admin password.
- Added a small clone fallback for browsers without `structuredClone`.

## Still intentionally not live-integrated
- Jobber API
- ACH/payment processor tokens
- SMS provider
- Live map/GPS provider

Those services now have setup areas, but they should not activate until real credentials are added and tested.
