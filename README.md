# Fiszki Web ("Kartoteka")

Mobile-first web & PWA interface for [`fiszki-server`](https://github.com/m4jorskyy/fiszki-server) (`main` production & `dev` staging), designed with the **Tactile Archival Index ("Kartoteka")** aesthetic.

## Features

- **100% `fiszki-server` API Coverage**:
  - **Health & Multi-Environment Routing**: Live `/healthz` check and zero-CORS Next.js proxy (`/api/proxy/[...path]`) supporting **Staging (`dev` / `:8081`)**, **Production (`main` / `:8080`)**, and custom backend URLs.
  - **Direct Auth Gate**: Sign in (`/api/v1/auth/login`), Register (`/api/v1/auth/register`), Profile (`/api/v1/auth/me`), silent single-flight token rotation (`/api/v1/auth/refresh`), and Logout (`/api/v1/auth/logout`).
  - **Decks & Import/Export**: Full CRUD (`/api/v1/decks`), 1-click CSV & JSON export (`/api/v1/decks/{id}/export`), and file/paste CSV & JSON import (`/api/v1/decks/{id}/import`).
  - **Cards & SM-2 Inspector**: Quick-add (`Cmd/Ctrl + Enter`), multi-row bulk add (`/api/v1/decks/{id}/cards/bulk`), server-side search/state/tag filtering (`/api/v1/decks/{id}/cards?q=&state=&tag=`), and full SM-2 card telemetry inspection & editing (`/api/v1/cards/{id}`).
  - **Gemini AI Photo Extraction Workbench**: Mobile camera capture (`capture="environment"`), image file upload, and `Cmd+V` clipboard paste (`/api/v1/cards/extract-from-photo`) with interactive candidate editing, front/back swap, batch tagging, and bulk save.
  - **SM-2 Study Session & Free Practice**: Due queue (`/api/v1/study/due`) with deck/tag/limit filters, exact SM-2 interval previews (`1m`, `6m`, `10m`, `1d`, `4d`, etc.) on buttons `1–4`, keyboard shortcuts (`Space`, `1–4`), review log telemetry (`/api/v1/study/cards/{id}/review`), and a non-destructive Free Practice mode.
  - **Study Ledger**: Overview statistics (`/api/v1/stats/overview`) showing due count, today's reviews, day streak, retention rate, and card state distribution.
- **Bilingual (`PL` / `EN`)** & **Light / Dark Desk Themes**.

## Quick Start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. Use the top environment badge (`STAGING` / `PROD` / `CUSTOM`) to switch between your local, staging (`:8081`), or production (`:8080`) `fiszki-server` instances.
