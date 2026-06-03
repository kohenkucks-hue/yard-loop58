# Yard Loop Rep Portal / CRM Command Center Shared Admin Fixes

This patch intentionally changes only the CRM / Command Center / `/rep` side of the project.

## Public Website Safety
The public website operating system was not redesigned or intentionally changed. Homepage, public Get My Plan, public estimator, contractor page, gallery, testimonials, legal pages, footer, and public navigation were left alone.

## Fixes Added

1. User Management now includes password/PIN reset fields for each user.
2. Kevin, Jamie, and Kohen are shown as Owner / Full Access accounts.
3. User role controls were added: Owner, Manager, Sales Rep, Office Staff.
4. Users can be disabled/reactivated without deleting their history.
5. Leads/customers can be reassigned from one user to another.
6. Settings now clearly includes Company Settings, Service Settings shortcut, Pricing Settings shortcut, and Shared Data/Backup controls.
7. Quick Estimate `Customize My Plan` now clears selected services and lets the rep build the plan manually.
8. Plan package labels now include Essential Plan, Premium Plan, Total Peace of Mind Plan, and Customize My Plan on the CRM side.
9. Service Availability was added in the CRM Pricing/Service Center.
10. Admin can add a new service and choose whether it appears in Quick Estimate and/or Detailed Estimate.
11. Account Manager and Assigned To dropdowns were added to the estimate flow.
12. A dedicated New Lead area was added.
13. Leads can be assigned and reassigned to Kevin, Jamie, Kohen, or future users.
14. ACH/payment status fields were added to both Quick and Detailed Estimate flows.
15. ACH fields use authorization, holder name, last 4 only, and notes. Full raw routing/account numbers should not be stored.
16. Integration sensitive fields remain masked by default.
17. Owner can Show/Hide sensitive integration values and mark integrations verified.
18. Shared cloud data controls were made more obvious so different devices can load/save the same CRM data using the Vercel ADMIN_PASSWORD.
19. The Rep Portal login now has an optional Cloud Sync Password field.
20. The dashboard explains shared device setup.

## Important Setup Requirement
For Kevin, Jamie, and Kohen to see the same customers/leads across devices, the Vercel test deployment must have:

- `ADMIN_PASSWORD`
- `BLOB_READ_WRITE_TOKEN`

Then each owner should enter that same `ADMIN_PASSWORD` as the Cloud Sync Password and use Load Shared / Save Shared.

## Not Changed
- Public homepage
- Public website design
- Public estimator route
- Public Get My Plan route
- Contractor page
- Existing website email routes
- Existing Blob content APIs
- Existing public CMS behavior
