# Yard Loop Blob-Only Patch

This ZIP is based on the version that already deployed to Vercel.

The goal was NOT to redesign or restructure the whole website. The only meaningful code changes are to make Vercel Blob work correctly while preserving the deployable project structure.

## What was fixed

- Removed unsupported `download` import from `@vercel/blob`.
- Replaced Blob reads with normal `fetch(blob.url, { cache: 'no-store' })`.
- Changed Blob writes/uploads from `access: 'private'` to `access: 'public'`, which is the compatible access mode for this Vercel Blob setup.
- Kept CMS content in `yard-loop-cms.json`.
- Kept leads in `yard-loop-leads.json`.
- Kept uploads in `yard-loop/uploads/...`.
- Added `/api/health` so you can test whether Blob is connected.

## What must be set in Vercel

In Vercel project settings, connect Vercel Blob storage to this project and make sure this environment variable exists:

```txt
BLOB_READ_WRITE_TOKEN
```

Also recommended:

```txt
ADMIN_PASSWORD
```

## Test after deploy

Open:

```txt
https://www.yard-loop.com/api/health
```

If Blob is connected correctly, `ok` should be `true`.

If the site deploys but Blob does not save, the problem is almost always the Blob store not being linked to the project or the missing `BLOB_READ_WRITE_TOKEN` environment variable.
