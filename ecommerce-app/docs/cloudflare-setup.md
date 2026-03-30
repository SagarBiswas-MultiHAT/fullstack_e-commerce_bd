# Cloudflare Setup Guide

This guide configures Cloudflare in front of your Vercel frontend and Railway backend.

## 1. Add Domain to Cloudflare

1. Sign in to Cloudflare and click Add a Site.
2. Enter your domain (for example `yourstore.com`) and choose the Free plan.
3. Review imported DNS records.
4. Cloudflare will provide two nameservers.
5. Go to your domain registrar and replace existing nameservers with Cloudflare nameservers.
6. Wait for status to become Active in Cloudflare.

## 2. Create DNS Records

Create these records in Cloudflare DNS.

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| A | `@` | Vercel edge IP (or use Vercel recommended DNS target) | Proxied |
| CNAME | `www` | `cname.vercel-dns.com` | Proxied |
| CNAME | `api` | `<your-railway-service>.up.railway.app` | Proxied |

Notes:
- Vercel may recommend using `A` records or `CNAME` depending on your setup. Follow Vercel domain instructions when they differ.
- Keep `api` on Railway custom domain and point Cloudflare CNAME to it.

## 3. SSL/TLS Configuration

1. Go to SSL/TLS -> Overview.
2. Set encryption mode to Full (Strict).
3. In Edge Certificates, enable Always Use HTTPS.
4. Enable Automatic HTTPS Rewrites.

## 4. Cache and Page Rules

Create a rule for static assets.

- URL pattern: `*yourstore.com/static/*`
- Action: Cache Level = Cache Everything
- Action: Edge Cache TTL = 1 month
- Action: Browser Cache TTL = 1 day
- Also keep Always Use HTTPS enabled globally.

## 5. Security Hardening

1. Security -> Bots: Enable Bot Fight Mode.
2. Security -> WAF: Keep managed DDoS protection enabled (default on Free tier).
3. Security -> WAF -> Rate limiting rules:
   - Match: `http.host eq "api.yourstore.com"`
   - Threshold: 50 requests per 10 seconds per IP
   - Action: Managed Challenge or Block
4. Security -> WAF -> Custom rules:
   - Create firewall rule to block suspicious user agents.

Suggested firewall expression:

```txt
(lower(http.user_agent) contains "sqlmap") or
(lower(http.user_agent) contains "nikto") or
(lower(http.user_agent) contains "curl/")
```

Action: Block.

## 6. Verify End-to-End

1. Confirm `https://yourstore.com` loads frontend from Vercel.
2. Confirm `https://api.yourstore.com/health` returns backend health payload.
3. Check SSL certificate status in Cloudflare and browser lock icon.
4. Test rate limiting using controlled load tests from a non-production IP.
