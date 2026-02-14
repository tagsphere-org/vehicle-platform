# TagSphere - Vehicle Contact Platform

A QR-based vehicle contact system that allows people to contact vehicle owners without exposing personal information.

**Domain:** tagsphere.co.in

## Architecture

```
tagsphere/
├── backend/          # Node.js + Express API
├── frontend/         # React + Vite web application
├── helm/tagsphere/   # Helm chart for Kubernetes deployment
├── docs/             # Roadmap & planning documents
└── docker-compose.yml
```

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB 7 (connection pool: 10-50)
- **Auth**: Firebase Phone Auth + JWT (with mock fallback)
- **Payments**: Razorpay (toggleable)
- **Hosting**: Docker / Kubernetes (Helm)

## Features

### Core (always available)
- Vehicle registration with phone OTP verification
- QR code generation per vehicle
- QR scan opens contact page (`tagsphere.co.in/v/{QR_ID}`)
- Send alert to vehicle owner (parked wrong, lights on, emergency, other)
- Owner dashboard with scan history
- Privacy-protected owner contact (phone never exposed)

### Toggleable via Feature Flags
- **Firebase Auth** — Real phone OTP via Firebase (mock OTP when disabled)
- **Razorpay Payments** — Subscription payments ("Coming Soon" when disabled)
- **Notifications** — SMS/WhatsApp alerts to owners on scan (coming soon)
- **Direct Calls** — Call owner from scan page ("Coming Soon" when disabled)

## Feature Flags

All third-party integrations are toggleable. The app runs safely with zero third-party config.

| Feature | Backend Env | Frontend Env | Default |
|---|---|---|---|
| Firebase Auth | `ENABLE_FIREBASE` | `VITE_ENABLE_FIREBASE` | `true` |
| Razorpay Payments | `ENABLE_RAZORPAY` | `VITE_ENABLE_RAZORPAY` | `false` |
| SMS/Push Notifications | `ENABLE_NOTIFICATIONS` | `VITE_ENABLE_NOTIFICATIONS` | `false` |
| Direct Calls | `ENABLE_CALLS` | `VITE_ENABLE_CALLS` | `false` |

**When disabled:** features degrade gracefully:
- Firebase disabled: mock OTP (any 6-digit code works, dev banner shown)
- Razorpay disabled: "Payments Coming Soon" on subscribe buttons
- Calls disabled: "Direct calls coming soon" on scan page, endpoint returns 503

**When enabled but credentials missing:** backend exits with a clear fatal error (catches misconfiguration).

## Pricing Plans

| | Free | Basic (₹149/mo) | Premium (₹299/mo) |
|---|---|---|---|
| Vehicle registration | Yes | Yes | Yes |
| QR code generation | Yes | Yes | Yes |
| Basic scan alerts | Yes | Yes | Yes |
| Notification credits | - | 25/month | 50/month |
| Call credits | - | 25/month | 50/month |
| Priority support | - | - | Yes |

30-day billing cycle. No automatic renewals. Call credits activate when direct calls launch.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or `docker-compose -f docker-compose.dev.yml up -d`)

### Backend

```bash
cd backend
cp .env.example .env   # Edit with your values
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env   # Edit with your values
npm install
npm run dev
```

### Both disabled (zero-config dev)

Set `ENABLE_FIREBASE=false` in both `.env` files to develop without Firebase credentials. Login uses mock OTP (any 6-digit code).

## Environment Variables

### Backend (`backend/.env.example`)

```bash
# Feature Flags
ENABLE_FIREBASE=true          # Firebase Phone Auth
ENABLE_RAZORPAY=false         # Razorpay payments
ENABLE_NOTIFICATIONS=false    # SMS/push notifications
ENABLE_CALLS=false            # Direct call feature

# Required
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret
ENCRYPTION_KEY=your-32-char-key

# Firebase (required when ENABLE_FIREBASE=true)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# Razorpay (required when ENABLE_RAZORPAY=true)
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

### Frontend (`frontend/.env.example`)

```bash
VITE_ENABLE_FIREBASE=true
VITE_ENABLE_RAZORPAY=false
VITE_ENABLE_NOTIFICATIONS=false
VITE_ENABLE_CALLS=false
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:3000/api
```

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/auth/config` | No | Returns `{ authMode: 'firebase' \| 'mock' }` |
| POST | `/api/auth/firebase-verify` | No | Verify Firebase ID token (when Firebase enabled) |
| POST | `/api/auth/mock-send-otp` | No | Mock OTP send (when Firebase disabled) |
| POST | `/api/auth/mock-verify` | No | Mock OTP verify (when Firebase disabled) |
| GET | `/api/auth/me` | JWT | Get current user |
| PUT | `/api/auth/profile` | JWT | Update profile |

### Vehicles & Scan
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/scan/:qrId` | No | Get vehicle info by QR code |
| POST | `/api/scan/:qrId/call` | No | Call owner (503 when calls disabled) |
| POST | `/api/scan/:qrId/alert` | No | Send alert to owner |

### Subscriptions
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/subscription/plans` | No | List plans + `paymentsEnabled` flag |
| GET | `/api/subscription/my-plan` | JWT | Get user's current plan |
| POST | `/api/subscription/create-order` | JWT | Create Razorpay order (503 when disabled) |
| POST | `/api/subscription/verify-payment` | JWT | Verify payment (503 when disabled) |

## Docker

```bash
# Production (requires .env file with secrets)
docker-compose up -d

# Development (MongoDB only)
docker-compose -f docker-compose.dev.yml up -d
```

Docker hardening:
- Non-root containers (USER nodejs / USER nginx)
- Multi-stage builds (minimal production images)
- .dockerignore (no .env, .git, node_modules in images)
- Health checks on all services
- Resource limits enforced

## Kubernetes Deployment (Helm)

### Install

```bash
kubectl create namespace tagsphere

helm install tagsphere ./helm/tagsphere -n tagsphere \
  --set backend.secrets.JWT_SECRET="your-jwt-secret" \
  --set backend.secrets.ENCRYPTION_KEY="your-32-char-encryption-key" \
  --set backend.secrets.FIREBASE_PROJECT_ID="your-project-id" \
  --set backend.secrets.FIREBASE_CLIENT_EMAIL="your-email" \
  --set backend.secrets.FIREBASE_PRIVATE_KEY="your-key" \
  --set mongodb.auth.rootPassword="your-mongo-password"
```

Enable Razorpay:
```bash
helm upgrade tagsphere ./helm/tagsphere -n tagsphere \
  --set backend.env.ENABLE_RAZORPAY="true" \
  --set backend.secrets.RAZORPAY_KEY_ID="rzp_..." \
  --set backend.secrets.RAZORPAY_KEY_SECRET="..."
```

Enable direct calls:
```bash
helm upgrade tagsphere ./helm/tagsphere -n tagsphere \
  --set backend.env.ENABLE_CALLS="true"
```

### What gets deployed

| Component | Type | Replicas | Resources |
|---|---|---|---|
| Frontend | Deployment | 2 | 100-250m CPU, 128-256Mi |
| Backend | Deployment | 2 | 250-500m CPU, 512Mi-1Gi |
| MongoDB | StatefulSet | 1 | 500m-1 CPU, 1-2Gi |
| Ingress | nginx | - | TLS + rate limiting |

### K8s Security

- SecurityContext: `runAsNonRoot`, `drop ALL` capabilities on all pods
- NetworkPolicy: MongoDB only accessible from backend pods
- PodDisruptionBudget: `minAvailable: 1` for backend and frontend
- ServiceAccounts: dedicated per service, `automountServiceAccountToken: false`
- Ingress: SSL redirect, rate limiting (20 rps), security headers
- Pod anti-affinity: replicas spread across nodes
- Secrets: conditional — Firebase/Razorpay secrets only created when feature enabled

## Security

- AES-256-GCM phone number encryption (random IV + auth tag)
- SHA-256 phone hashing for lookups (encrypted value never queried directly)
- Per-endpoint rate limiting (OTP: 10/min, scan: 20/min, call: 5/min, alert: 3/min)
- Hardened Helmet (CSP, HSTS, X-Frame-Options, Referrer-Policy)
- CORS origin validation
- JWT token authentication
- Random QR IDs (not sequential)
- Env + credential validation at startup (fail-fast)
- Graceful shutdown (SIGTERM/SIGINT)
- Feature flags prevent loading unused SDKs (Firebase, Razorpay)

## Repository

```bash
git remote set-url origin https://vinaypanwar@github.com/tagsphere-org/vehicle-platform.git
```

## Documentation

- [Product Vision & Expansion Roadmap](docs/ROADMAP.md)

## License

Proprietary - TagSphere
