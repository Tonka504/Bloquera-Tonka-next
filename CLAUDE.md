# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Non-standard Next.js version

`package.json` pins `next@16.2.10` — newer than anything in your training data, with breaking API/convention changes from the Next.js you know. **Before writing App Router code (routing, data fetching, config, metadata, etc.), check `node_modules/next/dist/docs/01-app/` for the current API.** Don't assume Next.js 13–15 patterns still apply.

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint (flat config, eslint-config-next)
```

There is no test suite/framework configured in this repo.

`DATABASE_URL` (Postgres connection string) must be set — see `.env.local`. `lib/db.ts` auto-disables SSL only when the URL contains `localhost`/`127.0.0.1`; anything else requires SSL.

## Architecture

This is a single-tenant inventory/invoicing management app ("Bloquera Tonka") for a concrete-block business, in Spanish. It's a small monolith, not a multi-package project.

- **Everything server-side lives in one file: `app/actions.ts`** (`'use server'`, ~750 lines). All data types and every DB read/write for every feature (pedidos, facturas, inventario, gastos, reportes, config, login) are defined here as exported `async function ...Action` / `get...` functions called directly from client components — no API routes, no separate service layer. When adding a feature, extend this file rather than creating a parallel pattern.
- **DB access**: `lib/db.ts` exports a single `sql` tagged-template client (`postgres` / postgres.js). All queries in `actions.ts` use `sql\`...\`` directly — no ORM, no query builder, no migrations tooling checked into the repo (schema changes are applied by hand against Postgres).
- **Server action return shape**: virtually every action returns `ServerResult<T> = { success: boolean; data?: T; message?: string }`. Follow this convention (try/catch, `console.error`, return `{ success: false, message }`) for new actions instead of throwing.
- **Auth is intentionally minimal**: `loginAction` does a plaintext username/password lookup against `usuarios` (no hashing, no sessions/cookies, no middleware). On success the client stores the user object in `localStorage` (see `app/page.tsx`, the login screen) and `app/dashboard/layout.tsx` reads nothing back from it — route protection is effectively client-side only. Don't assume a real auth/session layer exists unless you're asked to build one.
- **Core domain flow** (`despacharPedidoAction` in `app/actions.ts`): a row in `pedidos` (orders) gets "dispatched" — it's inserted into `historial_facturas` (the invoices/history table) with computed totals, matching `inventario` stock is decremented (matched by substring on the product name: `'4'|'5'|'6'` → `bloque_de_4"/5"/6"`), and the original `pedidos` row is deleted. There is no `facturas` table — "facturas" in the UI is `historial_facturas`.
- **Known DB tables**: `usuarios`, `pedidos`, `historial_facturas`, `inventario`, `historial_inventario`, `gastos`, `configuracion`.
- **Routes** (`app/`): `/` is the login page (client component); `/dashboard/*` (pedidos, facturas, inventario, gastos, reportes, config) share `app/dashboard/layout.tsx`, a client-rendered sidebar shell. Note `config` is deliberately hidden from the sidebar nav (see comment in `dashboard/layout.tsx`) but the route still works.
- **PDF generation**: `lib/generateInvoicePDF.ts` builds invoice PDFs client-side with `jspdf` + `html2canvas`.
- **Styling**: Tailwind CSS v4 (`@theme inline` in `app/globals.css`) with a custom brand palette exposed as `--color-brand-*` tokens (`brand-ink`, `brand-primary`, `brand-accent`, `brand-line`, etc.) — reuse these tokens rather than introducing new hex colors. Fonts: Inter (`--font-body`) for body text, Playfair Display (`--font-display`) for headings, both loaded via `next/font/google` in `app/layout.tsx`.
- Toasts go through `sonner` (`<Toaster>` mounted once in the root layout); icons are `lucide-react`.
