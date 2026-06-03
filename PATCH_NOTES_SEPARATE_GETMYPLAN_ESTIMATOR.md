# Yard Loop Patch — Separate Get My Plan and Estimator

This patch keeps the working email/form system intact and changes only page routing/toggle behavior and the shared service bank.

## Changed
- Added a separate public `/get-my-plan` customer request page.
- Kept `/estimate` as the live internal/customer estimator calculator page.
- Get My Plan buttons now point to `/get-my-plan`, not `/estimate`.
- Estimator toggle now controls only `/estimate`.
- Get My Plan page toggle now controls only `/get-my-plan`.
- Both pages use the same estimator service bank, so all live services appear on both.
- Added an Admin button to add a new additional job/service to the service bank.
- Fixed migration so services you turn ON from hidden/future status stay ON and publish live after Blob save/deploy.
- Preserved the working email delivery code.

## Admin steps after deploy
1. Go to Admin → Get My Plan / Pricing.
2. Turn ON Get My Plan Page if you want `/get-my-plan` live.
3. Turn ON Estimator Calculator Screen if you want `/estimate` live.
4. In Estimator Service Bank, turn services ON/OFF or add additional jobs.
5. Click Save to Blob.
