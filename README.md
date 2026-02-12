# TagSphere - Vehicle Contact Platform

A QR-based vehicle contact system that allows people to contact vehicle owners without exposing personal information.

## Architecture

```
tagsphere/
├── backend/          # Node.js + Express API
├── frontend/         # React web application
├── qr-generator/     # QR code generation utility
└── infra/            # Docker, CI/CD configs
```

## Features (MVP)

- ✅ Vehicle registration with OTP verification
- ✅ QR scan opens contact page
- ✅ Call owner button (privacy protected)
- ✅ Send alert to owner
- ✅ Owner dashboard

## URL Structure

```
tagsphere.in/v/{QR_ID}  →  Vehicle contact page
```

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Auth**: JWT + OTP
- **Hosting**: Vercel (FE) + Render/Railway (BE)

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

- OTP-based authentication
- Phone number encryption (AES-256)
- Rate limiting (10 req/min)
- JWT token authentication
- Random QR IDs (not sequential)
- HTTPS enforced

## Environment Variables

See `.env.example` in each directory.

## License

Proprietary - TagSphere
