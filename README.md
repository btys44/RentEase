# RentEase Kenya

A full-stack rental property management system for small-scale landlords in Kenya, with Landlord, Tenant, and Caretaker roles, M-Pesa payment tracking, PDF receipts, SMS notifications, and maintenance request workflows.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Express.js + Node.js
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** JWT with role-based access control (Landlord / Tenant / Caretaker)
- **PDF generation:** PDFKit (rent receipts + reports)
- **SMS:** Africa's Talking API (mocked automatically if no API key is set)
- **Payments:** Safaricom Daraja M-Pesa STK Push (mocked automatically if no credentials are set)

## Folder Structure

```
/client                  Vite + React frontend
  /src
    /pages                Page components, grouped by role (landlord/tenant/caretaker)
    /components            Shared UI (Layout, ProtectedRoute, StatusBadge, etc.)
    /context                AuthContext (JWT + current user)
    /utils                  Axios API client, shared TS types

/server                  Express.js backend
  /routes                  Route definitions
  /controllers             Request handlers / business logic
  /middleware               JWT auth guard, role guard, multer upload
  /prisma
    schema.prisma            Database schema
    seed.js                   Demo data seeder
  /utils                    Prisma client, M-Pesa, SMS, PDF receipt/report generators
```

## Prerequisites

- Node.js 18+
- A PostgreSQL database (local install, or a free hosted instance e.g. Supabase / Neon / Railway)

## 1. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` and set at minimum:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="a-long-random-secret-string"
```

Leave the M-Pesa and Africa's Talking variables blank to run in **mock mode** — the app will still fully function, printing simulated SMS messages and M-Pesa references to the server console instead of calling the real APIs.

Then run:

```bash
npx prisma migrate dev --name init   # creates tables in your database
npm run seed                          # loads demo data
npm run dev                           # starts the API on http://localhost:5000
```

### Demo login credentials (after seeding)

| Role      | Email                     | Password      |
|-----------|---------------------------|---------------|
| Landlord  | landlord@rentease.co.ke   | password123   |
| Caretaker | caretaker@rentease.co.ke  | password123   |
| Tenant    | tenant1@rentease.co.ke    | password123   |
| Tenant    | tenant2@rentease.co.ke    | password123   |
| Tenant    | tenant3@rentease.co.ke    | password123   |
| Tenant    | tenant4@rentease.co.ke    | password123   |

## 2. Frontend Setup

In a new terminal:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The app will be available at **http://localhost:5173**. The Vite dev server proxies `/api` and `/uploads` requests to the backend at `http://localhost:5000`, so you don't need to change `VITE_API_URL` unless you deploy the backend elsewhere.

## 3. Using the App

1. Log in as the **Landlord** and go to *Properties* to review the two seeded properties (Greenview Apartments, Sunrise Court) or add your own.
2. Go to *Tenants* to link tenants to vacant units (there are two vacant units in the seed data).
3. Go to *Payments* to record a rent payment — this auto-generates a downloadable PDF receipt and sends a (mocked) SMS + in-app notification to the tenant.
4. Log in as a **Tenant** to view payment history, download receipts, and submit maintenance requests with photos.
5. Log in as the **Caretaker** to view assigned-property tenants, log payments on their behalf, and update maintenance request status.
6. Back on the Landlord side, visit *Reports* for revenue charts, occupancy rate, outstanding balances, and a PDF export.

## Environment Variables Reference

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `PORT` | API port (default 5000) |
| `CLIENT_URL` | Frontend origin, for CORS |
| `AT_USERNAME` / `AT_API_KEY` | Africa's Talking credentials (optional — mocked if blank) |
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` / `MPESA_SHORTCODE` / `MPESA_PASSKEY` / `MPESA_CALLBACK_URL` | Daraja sandbox/production credentials (optional — mocked if blank) |
| `UPLOAD_DIR` | Local folder for uploaded photos/receipts (default `uploads`) |

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

## Notes

- Maintenance photos and generated PDFs are stored under `server/uploads/` and served statically at `/uploads/...`. For production, swap this for cloud storage (e.g. S3, Cloudinary).
- The M-Pesa and SMS integrations are safe to leave in mock mode for development and demos — every payment still gets a real PDF receipt and a real in-app notification.
- Run `npx prisma studio` from `/server` for a visual browser of your database while developing.
