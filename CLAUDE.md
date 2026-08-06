# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next` core-web-vitals + typescript)

No test suite exists in this repo.

`node_modules` is not installed in this checkout — run `npm install` before anything above will work.

## Architecture

Next.js App Router app (Spanish-language UI/data) for **Bloquera Tonka**, a small concrete-block factory's management system: pedidos (orders) → despacho (dispatch) → facturas (invoices), plus inventario, gastos (expenses), reportes, and configuración.

**Data layer is a single file of server actions.** All DB access lives in `app/actions.ts` (`'use server'`) — there is no API route layer. Every page is a client component (`'use client'`) that calls these exported async functions directly and gets back a uniform `ServerResult<T> = { success, data?, message? }`. When adding a feature, add a typed action there rather than a new route handler.

- `lib/db.ts` exports a single `postgres` (postgres.js) tagged-template client `sql`, built from `DATABASE_URL` (`ssl: 'require'`). No ORM/migrations tooling — schema changes are raw SQL applied directly to the DB.
- `app/actions.ts` groups actions by domain (LOGIN, DASHBOARD, PEDIDOS, GASTOS, INVENTARIO, PRODUCCION MANUAL, FACTURAS, REPORTES, CONFIGURACION) with their types defined at the top of the same file — there's no separate types module.
- Multi-query actions (dashboard/reportes aggregations) wrap each `sql` call in its own try/catch with a fallback default, so one failing query doesn't 500 the whole page — follow this pattern for new aggregate queries rather than one wrapping try/catch.
- `inventario.tipo` is a string key acting as a poor-man's enum: `bloque_de_4"`, `bloque_de_5"`, `bloque_de_6"`, `cemento_bolsas`, `arena_m3`. Code branches on `producto.toLowerCase().includes('4'|'5'|'6')` to map a pedido's free-text `producto` to the right inventory row — keep new product types consistent with this convention (or fix the matching in both `despacharPedidoAction` and `producirBloquesAction` together if you change it).
- Business flow: `despacharPedidoAction` converts a `pedidos` row into a `historial_facturas` row, decrements the matching `inventario` row, and deletes the pedido — treat this as the canonical "order → invoice" transition when touching either table. `producirBloquesAction` is the reverse-ish flow: consumes `cemento_bolsas`/`arena_m3` stock to produce bloques, logging every change to `historial_inventario`.
- No transactions are used around these multi-statement flows (postgres.js supports `sql.begin`); be aware partial failures can leave data inconsistent if you extend them.

**Auth is minimal and client-side.** `loginAction` checks plaintext `username`/`password` against `usuarios` in Postgres (no hashing, no sessions). On success the client stores the user in `localStorage` (`app/page.tsx`) and `app/dashboard/layout.tsx` reads nothing back from the server to gate access — there's no middleware-based route protection.

**Layout**: `app/dashboard/layout.tsx` renders the sidebar/header chrome (nav driven by a `menuItems` array — add new sections there) around each `app/dashboard/*/page.tsx`. Root `app/page.tsx` is the login screen.

PDF invoices are generated client-side in `lib/generateInvoicePDF.ts` via `jspdf` (called from the facturas page, not a server action).

Styling is Tailwind v4 (`@tailwindcss/postcss`) with hardcoded hex colors (`#1E40AF`, `#0F172A`, etc.) rather than a themed palette — match existing colors when touching UI.
