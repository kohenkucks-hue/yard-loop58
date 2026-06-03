# Yard Loop Backend CRM Operations V6 - Capacity / Pricing Fix Patch

## Purpose
This patch fixes the first issues found during backend CRM testing after the V5 operations patch.

## What was fixed / added

### 1. Capacity Enforcement Mode
Added owner-controlled capacity enforcement setting:
- **Off / Test Mode**: no capacity warnings; allows testing without contractors.
- **Warning Only**: shows capacity warnings but does not block signing/testing.
- **Strict Mode**: blocks signing if there is no approved contractor/admin capacity.

Default behavior remains safe for testing: warnings can be shown without stopping owner approval, payment gate, estimate saving, or signed-contract testing.

### 2. Capacity Can Be Entered Without Contractors
The capacity engine now checks both:
- approved contractors, and
- admin-entered capacity rows.

This allows owner/admin to add capacity for Omaha / Council Bluffs / etc. before every contractor is fully onboarded.

### 3. Starter Test Capacity Button
Added a **Load Starter Test Capacity** button under Capacity Management so testing can continue before real contractors are loaded.

### 4. Frequency-Level Pricing Controls
Service frequencies can now include optional point and contractor-cost overrides.

Format in Pricing/Admin:
`Label:annualUses:optionalPoints:optionalContractorCost`

Examples:
- `2x/year:2`
- `4x/year:4:18:360`
- `Quarterly:4:20:400`

If optional points/cost are blank, the system uses the automatic multiplier.
If optional points/cost are entered, those values control that frequency.

### 5. Frequency Pricing Calculation Improved
The estimator still supports automatic frequency multipliers, but now also supports owner-defined point/cost overrides for each service frequency.

### 6. Contractor Adding Workflow Improved
Owner can now add:
- contractor prospect, or
- approved contractor immediately.

This makes testing capacity and dashboard counts easier.

### 7. Owner Dashboard Contractor Visibility
New contractor prospects that are not approved/verified now appear in owner attention items so they are not lost.

### 8. Capacity Warning Display Improved
Capacity warnings now show whether they are:
- Warning Only, or
- Strict / blocks signing.

## Build check
`npm run build` completed successfully after this patch.

## Public website impact
No public website redesign was performed. This patch is focused on `/app/rep/page.jsx` backend CRM functionality and notes.
