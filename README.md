# TechPro Solutions

Electronics sales & repair website — full-stack Node.js + Express + MongoDB application.

---

## How to Run the Website

### 1. Install dependencies

```bash
cd "c:\Users\vikto\Desktop\Concordia_University\Computers_Website"
npm install
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Then edit `.env` and set a real `JWT_SECRET` (run the command below to generate one):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Start MongoDB (if not already running)

```bash
net start MongoDB
```

> If MongoDB was installed as a Windows Service it starts automatically. You can also run `mongod --dbpath "C:\data\db"` to start it manually.

### 4. Seed the database with 10 sample products

```bash
npm run seed
```

### 5. Start the server

```bash
npm run dev        # development (auto-restart)
npm start          # production
```

Open **http://localhost:5000** in your browser.

---

## What Was Built — All 22 Files

| Layer | File | Purpose |
|---|---|---|
| Config | `package.json`, `.env.example`, `.gitignore` | Project setup |
| Backend | `backend/server.js` | Express + helmet + rate limiting + CORS |
| Backend | `backend/config/db.js` | MongoDB connection |
| Backend | `backend/config/seed.js` | 10 sample products |
| Backend | `backend/models/User.js` | User schema — bcrypt hashing, payment token storage |
| Backend | `backend/models/Product.js` | Product schema with Amazon/eBay URL fields |
| Backend | `backend/middleware/authMiddleware.js` | JWT cookie verification |
| Backend | `backend/routes/auth.js` | Register, login, logout, profile, password change |
| Backend | `backend/routes/products.js` | Products with search/filter/pagination |
| Frontend | `public/css/styles.css` | Full responsive stylesheet |
| Frontend | `public/js/nav.js` | Injected navbar + footer + auth state on every page |
| Frontend | `public/js/auth.js` | Login/register forms + password strength meter |
| Frontend | `public/js/home.js` | Product grid with live search, filters, pagination |
| Frontend | `public/js/profile.js` | Profile update, password change, payment methods |
| Pages | `index.html` | Home with product grid + trust bar |
| Pages | `services.html` | PC repair + SOHO repair + 4-step process |
| Pages | `contact.html` | Instagram, Facebook, email cards + hours |
| Pages | `about.html` | Team (father & son), story, values |
| Pages | `login.html` | Tabbed login/register + live password strength |
| Pages | `profile.html` | Profile info, change password, payment methods |

---

## Security Highlights

- **Passwords** — bcrypt cost 12, 8 char minimum + uppercase + lowercase + number + special (enforced on both frontend AND backend)
- **Sessions** — JWT in `httpOnly; SameSite=Strict` cookies (JavaScript cannot read them → XSS-safe)
- **Brute force** — Auth endpoints limited to 15 attempts per 15 minutes
- **Payment data** — Card numbers never touch your server. The profile shows a Stripe Elements placeholder — configure your free Stripe account to enable real payments
- **HTTPS** — Use HTTP locally. For production: deploy behind Nginx + [Let's Encrypt](https://letsencrypt.org) (free) or use Railway/Render which provision HTTPS automatically

---

## Amazon & eBay Integration

Products in MongoDB have `amazonUrl` and `ebayUrl` fields. Product cards show **Buy on Amazon** and **Buy on eBay** buttons linking to your listings. When you're ready for full API sync (manage listings from your site), Amazon SP-API and eBay API credentials stay server-side — never exposed to the browser.
