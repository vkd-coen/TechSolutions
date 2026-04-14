# Security Guidelines — TechPro Solutions

## Overview

This document outlines the security measures implemented in the TechPro Solutions backend and best practices for deployment.

---

## Authentication & Authorization

### Password Security
- **Hashing**: bcrypt with cost factor 12 (resistant to GPU/ASIC attacks)
- **Requirements**: Minimum 8 characters, uppercase, lowercase, number, special character
- **Backend validation**: All passwords validated server-side (frontend validation is UX only)
- **Implementation**: `backend/models/User.js` → `pre('save')` hook hashes before persistence
- **Comparison**: Constant-time comparison via `bcrypt.compare()` prevents timing attacks

### Session Management
- **JWT Storage**: Stored in `httpOnly` cookies (immune to XSS token theft)
- **Cookie Flags**:
  - `httpOnly: true` — JavaScript cannot read the cookie
  - `sameSite: 'strict'` — CSRF protection, same-site requests only
  - `secure: true` — HTTPS only (production)
- **Token Expiry**: 7 days (configurable via `JWT_EXPIRE` env var)
- **Signing Secret**: Must be a strong random string (min 64 chars) — generate via:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

### Authorization
- Role-based access control: `admin` vs `user` roles
- Admin endpoints protected by `adminOnly` middleware
- User profiles can only be modified by the authenticated user

---

## Payment Security

### Card Data Handling
**Never store raw credit card numbers on your server.**

The payment profile stores:
- `last4` (last 4 digits)
- `brand` (Visa, Mastercard, etc.)
- `expMonth` / `expYear`
- `stripePaymentMethodId` (tokenized reference)

**Raw card data must never reach your backend.** Use one of these:

#### Option 1: Stripe Elements (Recommended)
```javascript
// Card data is tokenized directly in the browser
// Backend only receives a stripePaymentMethodId token
const result = await stripe.createPaymentMethod({
  type: 'card',
  card: cardElement,
});
// Send only result.paymentMethod.id to backend
```

#### Option 2: Stripe.js (Pre-built form)
Card data stays within Stripe's PCI-compliant infrastructure.

#### Option 3: PayPal
PayPal handles card data on their servers. Your backend never touches it.

### Why This Matters
- **PCI DSS Compliance**: Avoid the burden of Level 1 certification ($$$)
- **Legal Liability**: Payment processors assume liability, not you
- **Security**: Stripe, PayPal are security experts; you're not storing the crown jewels

---

## Input Validation & Sanitization

### Backend Validation
All routes use `express-validator`:
```javascript
body('email').isEmail().normalizeEmail()
body('password').isLength({ min: 8 })
body('firstName').trim().notEmpty()
```

### XSS Prevention
- **Frontend**: Text inputs are HTML-escaped before display
- **Response**: REST API returns JSON (not HTML), immune to injection
- **Content-Type**: Header: `application/json` (not `text/html`)
- **CSP Headers**: Helmet.js restricts script sources

### SQL/NoSQL Injection
- **Parameterized Queries**: Mongoose schemas use strict type checking
- **No String Interpolation**: Never concatenate user input into queries
- **Schema Validation**: Mongoose enforces field types and validators

---

## Network Security

### HTTPS (TLS/SSL)
**Development**: HTTP on localhost:5000 is acceptable during development.

**Production**: HTTPS is mandatory.

#### Via Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate (valid 90 days)
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renewal (runs twice daily)
sudo systemctl enable certbot.timer
```

#### Via Nginx Reverse Proxy
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### Via Cloud Platforms (Automatic)
- **Railway**: HTTPS provisioned automatically
- **Render**: Free SSL certificates included
- **Vercel**: Built-in HTTPS
- **Heroku**: Free SSL for *.herokuapp.com

### Security Headers (Helmet.js)
Backend automatically sets:
- `X-Content-Type-Options: nosniff` — prevent MIME sniffing
- `X-Frame-Options: DENY` — prevent clickjacking
- `X-XSS-Protection: 1; mode=block` — browser XSS filtering
- `Strict-Transport-Security` — HSTS (HTTPS only)
- `Content-Security-Policy` — restrict resource sources

---

## Rate Limiting & DDoS Protection

### Brute Force Protection
Auth endpoints (`/api/auth/login`, `/api/auth/register`) limited to:
- **15 requests per 15 minutes** per IP
- Returns `429 Too Many Requests` when exceeded

### General Rate Limit
All `/api` routes limited to:
- **200 requests per 15 minutes** per IP

### Deployment
On production, add a WAF (Web Application Firewall):
- **Cloudflare** (free tier available): DDoS, bot protection
- **AWS WAF**: IP rate limiting, geo-blocking
- **Nginx rate_limit**: Simple, effective

---

## Database Security

### MongoDB Authentication
**Never run MongoDB without authentication in production.**

```javascript
// Connect with credentials
mongoose.connect(
  `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@host:27017/techpro?authSource=admin`
);
```

### Encryption at Rest
MongoDB Enterprise includes encryption (paid). For free tier, use:
- **Host-level encryption**: Full disk encryption (LUKS, BitLocker, FileVault)
- **Database backup encryption**: Encrypt backups before storing offsite

### Network Isolation
- **Local dev**: MongoDB on localhost (no network exposure)
- **Production**: MongoDB on private VPC subnet, not exposed to internet
- **Connection**: Use SSH tunnel or VPN for remote access

---

## Environment Variables

**Never commit `.env` to version control.**

Use `.gitignore` (included):
```
.env
node_modules/
*.log
```

Required variables (generate fresh for each deployment):
```
JWT_SECRET=<64-char hex string>
MONGODB_URI=mongodb://user:pass@host/db
NODE_ENV=production
PORT=5000
STRIPE_SECRET_KEY=sk_live_... (if using Stripe)
```

---

## Deployment Checklist

- [ ] `NODE_ENV=production` in env vars
- [ ] HTTPS configured (`secure: true` in JWT cookies)
- [ ] MongoDB password-protected and isolated
- [ ] `.env` file excluded from repo
- [ ] CORS origin set correctly (not `*`)
- [ ] Rate limiting active
- [ ] Security headers enabled (Helmet.js)
- [ ] Error messages don't leak internals (logs only)
- [ ] Database backups encrypted and stored offsite
- [ ] Monitor logs for failed auth attempts
- [ ] Regular dependency updates (`npm audit fix`)

---

## Incident Response

### Suspected Breach
1. **Stop the server**: `npm stop` or kill-switch
2. **Rotate secrets**: New JWT_SECRET, all client session tokens invalidated
3. **Audit logs**: Review database access logs
4. **Reset user passwords**: Next login will force reset
5. **Notify users**: If payment data exposed (though it shouldn't be)

### Dependency Vulnerabilities
```bash
npm audit                 # Check for vulnerabilities
npm audit fix             # Auto-fix (safe fixes only)
npm update                # Update to latest versions
```

Set up automated updates:
- **Renovate Bot** or **Dependabot** on GitHub
- Auto-merge patch versions, review minor/major

---

## Support & Further Reading

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Node.js Best Practices**: https://nodejs.org/en/docs/guides/security/
- **CWE/SANS Top 25**: https://cwe.mitre.org/top25/
- **Helmet.js Docs**: https://helmetjs.github.io/
- **Mongoose Security**: https://mongoosejs.com/docs/security.html

---

## Questions?

Review the inline comments in the backend code for implementation details. Security is an ongoing practice.
