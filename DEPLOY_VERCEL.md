# Deploy `omnivisio` (WhatsApp + Neon) on Vercel

## 1. Project setup

- In Vercel: **Add New Project** → import this repo.
- Set **Root Directory** to `omnivisio` (if the repo contains multiple apps).

## 2. Environment variables

Add these in **Project → Settings → Environment Variables** (Production + Preview as needed):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string (`postgresql://...neon.tech/...`) |
| `WHATSAPP_TOKEN` | Meta WhatsApp Cloud API access token |
| `WHATSAPP_PHONE_ID` | WhatsApp phone number ID from Meta |
| `WHATSAPP_VERIFY_TOKEN` | Your chosen verify token (must match Meta webhook) |

Optional:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` |

Do **not** commit secrets. Use Vercel env UI only.

## 3. Meta (WhatsApp) webhook URL

After deploy you get a URL like `https://<project>.vercel.app`.

Configure in **Meta Developer → WhatsApp → Configuration**:

- **Callback URL:** `https://<project>.vercel.app/webhook`
- **Verify token:** same string as `WHATSAPP_VERIFY_TOKEN`

**ngrok** is only for local development. Production uses the Vercel HTTPS URL.

## 4. Health checks

- `GET /health` — JSON with status and timestamp  
- `GET /api/health` — `{ "status": "ok" }` (fast, no DB)

## 5. Build

Vercel runs `npm run build` (TypeScript → `dist/`). The serverless entry is `api/index.ts`, which **exports the Express `app` directly** (no `serverless-http`).

## 6. Local development

```bash
cd omnivisio
npm install
npm run dev
```

Use ngrok only locally: `ngrok http 3000` → set Meta callback to `https://<ngrok>/webhook`.
