# Yard Loop Rep Portal / Command Center Test Patch

Built as a test add-on on top of the uploaded working ZIP. The live public website is not replaced by this patch unless you deploy this ZIP to a Vercel test project.

## New URL
- `/rep` — hidden Yard Loop Command Center / Rep Portal

## Login
Default test users are included:
- Kevin Kucks — Owner
- Jamie Kucks — Owner
- Kohen Kucks — Owner

Default test PIN for all three is `0000`. Change PINs inside the Users tab before real use.

## Added Features
- PWA/Home Screen manifest so Yard Loop can be added to an iPhone/iPad home screen
- Owner/family full-access accounts
- Future sales rep user management
- Add/disable users without deleting history
- Reassign records if a rep quits
- Activity/audit feed
- Local browser data storage with cloud-save API framework
- Cloud export API framework
- Dashboard with customers, estimates, MRR, tasks, alerts
- Quick Estimate mode
- Detailed Estimate mode
- Subscription-first workflow
- One-time member add-on option
- Customer info capture
- Property tier selection using current estimator tiers from CMS
- Service bundles
- Push-button service selection
- Service-specific frequencies
- Service-specific detailed measurement fields
- Driveway length/width
- Deck length/width/stairs/railing feet
- Gutter linear feet
- Mulch bed square feet/depth
- Window counts
- House square footage
- Sprinkler zones
- Outdoor insect/perimeter support
- Shrub, aeration, leaf, snow, custom service framework
- Contractor cost overrides
- Point overrides
- Monthly price calculation
- Annual contract value
- Estimated contractor cost
- Gross profit
- Margin percentage
- Green/yellow/red margin warning
- Discount percentage input
- Payment status buttons: ACH, card, manual invoice
- Signature name field
- Save Estimate
- Follow Up
- Signed Contract
- Customer CRM list
- Customer profile reuse/property measurement storage framework
- Pricing center for margin rules and service cost database
- Operations tab with Jobber sync status framework
- Internal task/reminder system
- Referral tracker
- Pending review/gallery proof framework
- Settings for service areas, company mode, export/backup/reset

## Important Protection Notes
This patch does not intentionally change:
- Existing public estimator page
- Existing Get My Plan page
- Existing email routing
- Existing contractor form logic
- Existing pricing CMS data structure
- Existing public site page structure

## Future Live Integrations Still Needed
The interface and data fields are ready, but real production use will still require credentials/setup for:
- Jobber API customer/job creation
- ACH/card processor tokenization
- Real per-user authentication provider if desired
- Production database if Yard Loop outgrows Vercel Blob JSON storage

## Testing Recommendation
Deploy this ZIP to a separate Vercel test project first, such as `yard-loop-rep-test`, and test `/rep` on iPhone, iPad, and desktop before merging to the live domain.


## Triple-Check Pro Polish Patch
- Rebuilt `/rep` into a cleaner mobile-first Command Center.
- Added stronger Yard Loop branding, logo placement, and polished dashboard hero.
- Added real signature pad instead of only typed signature.
- Added property photo upload previews for estimates.
- Added duplicate-address warning.
- Added door-knocking outcome tracker.
- Added Neighborhood Radar / route-density framework.
- Added Sales Training / objection script tab.
- Added editable user creation form instead of prompt-only user creation.
- Added task assignment form.
- Added billing watch controls and Jobber sync status controls.
- Added backup import support.
- Removed the hard-coded private cloud password from the client-side portal.
- Production build compile check passed; the local container timed out during final build tracing after successful compilation/static page generation, which appears environmental.
