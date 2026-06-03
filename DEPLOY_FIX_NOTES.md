# Yard Loop Deploy Fix Notes

This ZIP fixes the Vercel deployment failure shown as:

`npm error Exit handler never called!`

What was changed:

- Removed the old package-lock.json that contained problematic install metadata.
- Added `.npmrc` to force clean public npm install behavior.
- Added a Vercel install command that avoids recreating/using a broken lockfile during deployment.
- Pinned dependency versions for Next, React, React DOM, and Vercel Blob.
- Added Node engine range for Vercel.
- Tested locally with:
  - `npm install --no-package-lock --no-audit --no-fund --legacy-peer-deps`
  - `npm run build`

Local build result: PASSED.

After upload to Vercel:

1. Make sure the Blob store is Public.
2. Make sure `BLOB_READ_WRITE_TOKEN` exists in Vercel Project Settings > Environment Variables.
3. Redeploy without build cache if Vercel gives you the option.
4. Test `/api/health`.
