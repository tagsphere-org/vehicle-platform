# TagSphere - Vehicle Contact Platform

A QR-based vehicle contact system that allows people to contact vehicle owners without exposing personal information.

**Domain:** tagsphere.co.in

## Repository Setup

```bash
git remote set-url origin https://vinaypanwar@github.com/tagsphere-org/vehicle-platform.git
git push origin main
```

## Architecture

```
tagsphere/
├── backend/          # Node.js + Express API
├── frontend/         # React web application
├── qr-generator/     # QR code generation utility
├── docs/             # Roadmap & planning documents
├── helm/tagsphere/   # Helm chart for Kubernetes deployment
└── infra/            # Docker, CI/CD configs
```

## Features (MVP)

- Vehicle registration with OTP verification
- QR scan opens contact page
- Call owner button (privacy protected)
- Send alert to owner
- Owner dashboard

## URL Structure

```
tagsphere.co.in/v/{QR_ID}  →  Vehicle contact page
```

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB (connection pool: 10-50)
- **Auth**: JWT + OTP
- **Hosting**: Kubernetes / Docker

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Security Features

- AES-256-GCM phone number encryption (with random IV + auth tag)
- Cryptographically secure OTP generation (`crypto.randomInt`)
- Timing-safe OTP comparison
- Per-endpoint rate limiting (OTP send: 3/min, OTP verify: 5/15min, scan: 20/min, call: 5/min)
- Hardened Helmet (CSP, HSTS, X-Frame-Options, Referrer-Policy)
- CORS origin validation
- JWT token authentication
- Random QR IDs (not sequential)
- Env validation at startup (fail-fast if secrets missing)
- Graceful shutdown (SIGTERM/SIGINT)

## Environment Variables

See `backend/.env.example`.

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

Deploy the complete stack to any Kubernetes cluster.

### Install

```bash
kubectl create namespace tagsphere

helm install tagsphere ./helm/tagsphere -n tagsphere \
  --set backend.secrets.JWT_SECRET="your-real-jwt-secret" \
  --set backend.secrets.ENCRYPTION_KEY="your-32-char-encryption-key!!" \
  --set backend.secrets.OTP_API_KEY="your-otp-api-key" \
  --set mongodb.auth.rootPassword="your-mongo-password"
```

### Upgrade

```bash
helm upgrade tagsphere ./helm/tagsphere -n tagsphere
```

### Uninstall

```bash
helm uninstall tagsphere -n tagsphere
```

### What gets deployed

| Component | Type | Replicas | Resources |
|-----------|------|----------|-----------|
| Frontend  | Deployment | 2 | 100-250m CPU, 128-256Mi |
| Backend   | Deployment | 2 | 250-500m CPU, 512Mi-1Gi |
| MongoDB   | StatefulSet | 1 | 500m-1 CPU, 1-2Gi |
| Ingress   | nginx | - | TLS + rate limiting |

### K8s Security

- SecurityContext: `runAsNonRoot`, `drop ALL` capabilities on all pods
- NetworkPolicy: MongoDB only accessible from backend pods
- PodDisruptionBudget: `minAvailable: 1` for backend and frontend
- ServiceAccounts: dedicated per service, `automountServiceAccountToken: false`
- Ingress: SSL redirect, rate limiting (20 rps), security headers
- Pod anti-affinity: replicas spread across nodes
- Secrets: empty defaults — must be provided at install time

### Connection Pooling (100 concurrent users)

- Backend Mongoose: `maxPoolSize=50, minPoolSize=10`
- MongoDB URI includes pool params
- Backend resources sized for sustained load (512Mi-1Gi)
- MongoDB resources sized for working set (1-2Gi)

## Documentation

- [Product Vision & Expansion Roadmap](docs/ROADMAP.md)

## License

Proprietary - TagSphere
