# Connecting Your GoDaddy Domain to Vercel

## In Vercel (do this first)
1. Go to your Yard Loop project
2. Click Settings → Domains
3. Type in: yard-loop.com
4. Click Add
5. Also add: www.yard-loop.com
6. Vercel will show you the DNS records you need to add

## In GoDaddy
1. Log into GoDaddy
2. Go to My Products → Domains → yard-loop.com → DNS
3. Delete any existing A records pointing to GoDaddy parking pages
4. Add these records:

### For the root domain (yard-loop.com):
- Type: A
- Name: @
- Value: 76.76.21.21
- TTL: 600

### For www subdomain:
- Type: CNAME
- Name: www
- Value: cname.vercel-dns.com
- TTL: 600

## After adding DNS records
- DNS changes take 10 minutes to 48 hours to fully propagate
- Vercel will automatically issue an SSL certificate once it detects the records
- You can check status in Vercel → Settings → Domains

## Important
- Do NOT use GoDaddy's website forwarding or parking - delete those first
- Keep your GoDaddy account active (just the domain registration, not hosting)
- Vercel handles all the hosting - GoDaddy just points the domain
