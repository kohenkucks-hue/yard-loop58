# Yard Loop Backend CRM Test Plan

## 1. Deploy Test
1. Upload ZIP to GitHub/Vercel test deployment first.
2. Open `/rep`.
3. Log in with `kevin` / `0000`.
4. Confirm the owner dashboard loads.
5. Enter the Cloud Sync Password if using Vercel Blob shared data.

## 2. Owner Dashboard Test
1. Confirm dashboard shows Pending Approvals, MRR, Avg Margin, Leads Today, Signed Today, Payment Issues, Photo Issues.
2. Add a test customer/estimate later and verify dashboard numbers change.

## 3. User Permission Test
1. Go to User Management.
2. Add a fake Sales Rep with PIN `0000`.
3. Log out and log in as that rep.
4. Confirm the rep does NOT see Pricing, Users, Contractors, Capacity, Reports, Integrations, or Settings.
5. Confirm the rep can access Neighborhood, Estimate, Leads, Customers, Approvals, Training.

## 4. Frequency Pricing Test
1. Log in as owner.
2. Open Estimate.
3. Select Standard Property.
4. Select Window Cleaning.
5. Note monthly price at `2x/year`.
6. Change windows to `4x/year` or Quarterly.
7. Confirm points, contractor cost, and monthly price increase.
8. Repeat with dog poop pickup weekly vs bi-weekly.

## 5. Property Size Pricing Test
1. Select one service.
2. Change Small → Standard → Large → Estate.
3. Confirm price rises as property tier price-per-point rises.

## 6. Margin Guardrail Test
1. Create an estimate.
2. Add a large discount above the rep limit.
3. Confirm warning/locked deal appears.
4. Try clicking Signed Contract.
5. Confirm it blocks closing and says owner approval required.

## 7. Owner Approval Test
1. On the locked deal, click Request Owner Approval.
2. Go to Approval Center as owner.
3. Confirm the deal appears with monthly price, margin, grade, and reason.
4. Click Approve Deal.
5. Click Load Into Estimator.
6. Confirm the estimator says owner approval loaded and Signed Contract unlocks.
7. Test Counter Price and Reject as well.

## 8. Payment Gate Test
1. Try signing a deal with payment status `Not collected`.
2. Confirm it blocks activation.
3. Change payment status to `ACH enrolled`, `Card on file`, or `Manual invoice approved`.
4. Confirm Signed Contract works.

## 9. Neighborhood Mode Test
1. Open Neighborhood Mode.
2. Add a prospect address.
3. Open it into Estimate.
4. Log a Door Hanger / No Answer.
5. Enter the same address again.
6. Confirm previous contact/history appears.
7. Mark one as Do Not Contact and confirm estimator blocks signing/contact flow.

## 10. Existing Customer Test
1. Sign a test contract.
2. Go back to Estimate and enter the same address.
3. Confirm it shows Active Customer and warns not to duplicate.
4. Open Customer tab and use Upsell / Change instead.

## 11. Contractor Management Test
1. Go to Contractors.
2. Add a contractor.
3. Verify all onboarding items.
4. Approve the contractor.
5. Confirm Approved Contractor count changes on Owner Dashboard.

## 12. Capacity Management Test
1. Go to Capacity.
2. Add capacity for Omaha / Lawn Mowing.
3. Create an estimate in Omaha with Lawn Mowing.
4. Confirm no warning for that service.
5. Add a service with no approved capacity and confirm warning appears.

## 13. Jobs / Completion Photos Test
1. Sign a contract with multiple selected services.
2. Go to Jobs.
3. Confirm jobs were created for selected services.
4. Mark a job completed without before/after photos.
5. Confirm dashboard shows photo issue.
6. Mark Before Photo and After Photo uploaded.
7. Confirm warning clears.

## 14. Backup / Cloud Sync Test
1. Click Backup and download JSON.
2. If cloud sync is set up, Save Cloud.
3. Open another browser/device, enter same Cloud Sync Password, Load Cloud.
4. Confirm records appear.

## 15. Public Website Regression Check
1. Open Home page.
2. Open Get My Plan page.
3. Open Estimator page.
4. Open Contractor page.
5. Confirm public pages still load and layout did not change.
