# Yard Loop Backend CRM Operations Patch v5

This patch intentionally focuses on the backend `/rep` CRM / operations system. The public website layout/pages were not redesigned.

## Added / Upgraded

### Owner Daily Dashboard
- Pending approvals
- MRR
- Average quoted margin
- New leads today
- Contracts signed today
- Payment/ACH issues
- Completion photo issues
- Approved contractor count
- Activity feed

### Sales Rep Dashboard / Permissions
- Sales reps only see limited tabs: Dashboard, Neighborhood, Estimate, Leads, Customers, Approvals, Training.
- Sales reps cannot edit company pricing, contractor costs, margin settings, integrations, users, reports, or owner-only controls.
- Owners/managers get full backend access.

### Advanced Estimator
- Property tier pricing still uses base price + points × price-per-point.
- Service frequency now changes pricing through frequency factors.
- Hidden/future jobs included: dog poop pickup, holiday lights, plant potting/seasonal planters, shrub trimming, leaf cleanup.
- Detailed service difficulty affects points and estimated contractor cost.
- Custom service supports custom customer price and contractor cost.

### Margin Guardrails
- Live points, monthly price, annual value, contractor cost, gross margin, deal grade.
- Green/yellow/red margin status.
- Rep discount limit.
- Hard margin floor.
- Red/locked deals cannot be signed by reps until owner approved.
- Payment/ACH/card must be completed or manually approved before activation when required.

### Owner Approval Workflow
- Rep can request owner approval when discount/margin is outside rules.
- Owner Approval Center shows customer, address, monthly amount, margin, grade, and reason.
- Owner can approve, reject, or counter-price.
- Rep can load approved deal back into estimator to close.
- Approval history remains saved.

### Neighborhood Mode / Property History
- Fast door-to-door workflow.
- Add/select properties without rebuilding an estimate for every house.
- Address status detection: new prospect, previously contacted, estimate given, active customer, do-not-contact.
- Door knock log: no answer, talked, door hanger left, do not contact.
- Active customers are treated differently from new prospects to avoid duplicate contracts.

### Customer Controls
- Customer records store selected services, measurements, payment status, route score, margin, deal grade, renewal date.
- Existing customer can be opened for upsell/change instead of duplicate sale.
- Owner pause/reactivate control.

### Contractor Management
- Contractor profiles.
- Service, area, capacity, insurance, W-9, agreement, score, status.
- Approve/deactivate contractors.
- Verify all onboarding items.

### Capacity Management
- Area/service capacity tracking.
- Estimator warns when selected services have no approved contractor capacity in the area.

### Jobs / Completion Photos
- Signed contracts create unassigned jobs by selected service.
- Job status tracking.
- Before/after photo requirement placeholders.
- Jobs missing completion photos show on owner dashboard.

### Reports / Backup / Integrations
- MRR, annualized active value, annual quoted, average margin, leads, contracts.
- Local JSON backup/export/import.
- Cloud sync preserved through existing `/api/rep-data` and `/api/rep-export` endpoints.
- Integration placeholders preserved for Jobber, payments, maps, and email.

## Important Notes
- This is a functional backend CRM foundation, not a replacement for Jobber/payment processing yet.
- No actual bank/card numbers should be stored in the CRM.
- Live owner approval depends on shared cloud sync being configured with the same Vercel ADMIN_PASSWORD on rep/owner devices.
- Google Maps/GPS live map can be connected later; this patch adds the workflow and data structure.
