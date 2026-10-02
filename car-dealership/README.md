# Apex Motors — Car Dealership Inventory System

A full-stack car dealership inventory app: a Node.js/Express REST API backed by
SQLite, and a React (Vite + Tailwind) single-page frontend styled as a dark,
gold-accented "Apex Motors" showroom with a separate Admin Portal.

## Project structure

```
car-dealership/
  backend/     Express API + SQLite (better-sqlite3) + Jest/Supertest tests
  frontend/    React + Vite + Tailwind SPA
  README.md    This file
  PROMPTS.md   Raw AI chat logs used while building this project
```

## Features

- **Auth**: register/login with bcrypt-hashed passwords and JWT bearer tokens.
- **Vehicles API**: create, list, search (make/model/category/price range),
  update, delete (admin-only).
- **Inventory transactions**: `purchase` (any authenticated user) and
  `restock` (admin only) run as single atomic SQL statements — a purchase can
  never oversell, even under concurrent requests — and every change is
  recorded in an `inventory_ledger` audit table.
- **Frontend**: Customer Portal (natural-language + sidebar search, vehicle
  grid, disabled "Buy" button when sold out) and Admin Portal (inventory
  table, restock, edit, delete, add-vehicle modal).

## Feature highlights

- **Role-routed portals** — signing in or registering takes you straight to
  your Customer or Admin portal; there's no shared "browse before you log
  in" home screen, and no manual portal switch. The role picked at
  registration is what routes you from then on.
- **Vehicle photography** — every listing has a photo (card thumbnail,
  cart line item, comparison table, and a large hero image on the detail
  view), sourced via an `image_url` field admins can set per vehicle.
- **Detail-first ordering** — every vehicle opens into a full detail view
  (large photo, stock number, specs, description, live stock count, and a
  "You might also like" strip of similar vehicles) before it can be added
  to the cart and ordered; nothing is a one-click blind purchase.
- **Full order lifecycle** — orders move CONFIRMED → PROCESSING → SHIPPED →
  DELIVERED. Admins accept/ship/deliver from the Orders panel (with CSV
  export); **customers can cancel their own order themselves, but only
  while it's still CONFIRMED or PROCESSING** — once an admin marks it
  SHIPPED, cancellation is no longer offered to the customer (backend
  enforces the same cutoff regardless of what the UI shows).
- **Visual order tracking** — orders render as a 4-stage progress tracker
  (Confirmed → Accepted → Shipped → Delivered) in both the customer's "My
  Orders" and the admin's order queue, instead of just a status label.
- **Admin dashboard** — a stats view (default tab in the Admin Portal) with
  live revenue, units sold, average order value, an order-status funnel
  chart, low-stock/out-of-stock alerts, and a top-sellers leaderboard.
- **Recently viewed** — the last few vehicles a shopper opened the detail
  view for appear as a strip at the top of the showroom (client-side,
  survives a refresh).
- **Favorites / wishlist** — heart any vehicle to save it, filter the
  showroom to "Favorites only," saved per account.
- **Side-by-side comparison** — select up to 3 vehicles from the grid and
  compare specs, price, and stock in one table, then buy straight from it.
- **Account-scoped cart** — the cart persists across a refresh and is kept
  separate per signed-in account, so switching users never leaks one
  shopper's cart into another's session.
- **Session handling** — an expired or invalid token signs the user out
  cleanly instead of leaving the UI stuck throwing failed requests.

## Prerequisites

- Node.js 18+
- npm

## Backend setup

```bash
cd backend
cp .env.example .env      # adjust JWT_SECRET etc. if you like
npm install
npm run seed               # creates SQLite db + demo data + demo users
npm run dev                 # starts the API on http://localhost:4000
```

Demo accounts created by the seed script:

| Role  | Email                     | Password      |
|-------|---------------------------|---------------|
| Admin | admin@apexmotors.com      | Admin123!     |
| User  | customer@apexmotors.com   | Customer123!  |

> **Upgrading an existing local database?** `npm run seed` (or just
> restarting `npm run dev`, which runs the migration on boot) is safe to
> re-run — it adds the new `image_url` column to an existing
> `data/dealership.db` without touching your existing rows, and backfills a
> category-appropriate photo onto any vehicle that doesn't have one yet.

### Running backend tests

```bash
cd backend
npm test
```

This runs the Jest + Supertest suite (auth flows, CRUD, search filters, and
— importantly — a concurrency test proving two simultaneous purchase
requests against a single unit of stock can never both succeed) against an
isolated `data/test.db` SQLite file, and prints a coverage summary.

## Frontend setup

```bash
cd frontend
cp .env.example .env      # points at http://localhost:4000/api by default
npm install
npm run dev                 # starts Vite dev server on http://localhost:5173
```

Open http://localhost:5173, click **Sign In**, and either log in with a demo
account or register your own (you can pick "Admin" as the account type when
registering, which is a deliberate simplification for grading convenience —
see the note in `authController.js`).

## API reference

| Method | Endpoint                        | Auth        | Description                          |
|--------|----------------------------------|-------------|---------------------------------------|
| POST   | `/api/auth/register`            | Public      | Create an account, returns a JWT      |
| POST   | `/api/auth/login`                | Public      | Log in, returns a JWT                 |
| GET    | `/api/vehicles`                  | User/Admin  | List all vehicles                     |
| GET    | `/api/vehicles/search`           | User/Admin  | Filter by make/model/category/price   |
| GET    | `/api/vehicles/:id`              | User/Admin  | Fetch one vehicle                     |
| POST   | `/api/vehicles`                  | Admin       | Create a vehicle                      |
| PUT    | `/api/vehicles/:id`               | Admin       | Update a vehicle                      |
| DELETE | `/api/vehicles/:id`               | Admin       | Delete a vehicle                      |
| POST   | `/api/vehicles/:id/purchase`      | User/Admin  | Atomically decrement quantity by 1    |
| POST   | `/api/vehicles/:id/restock`       | Admin       | Atomically increment quantity         |
| POST   | `/api/orders`                     | User/Admin  | Checkout the cart: buyer details + `items[]` → creates one order, atomically decrements every item's stock (all-or-nothing) |
| GET    | `/api/orders`                     | User/Admin  | List your own orders (admins see every order) |
| GET    | `/api/orders/:id`                  | User/Admin  | Fetch a single order (owner or admin only) |
| PATCH  | `/api/orders/:id/status`           | Admin       | Move an order forward through its lifecycle (`PROCESSING` → `SHIPPED` → `DELIVERED`) or `CANCELLED`; cancelling atomically restocks every item |
| POST   | `/api/orders/:id/cancel`           | User/Admin  | Self-service cancel for the order's owner (or admin) — only while status is `CONFIRMED` or `PROCESSING`; rejected with 409 once `SHIPPED` |

Vehicles also accept an optional `image_url` field on create/update — the
admin "Add/Edit Vehicle" form exposes it with a live preview, and it's what
powers the photo shown on cards, the cart, the comparison table, and the
detail view.

### Order lifecycle & cancellation rules

```
CONFIRMED ──▶ PROCESSING ──▶ SHIPPED ──▶ DELIVERED
    │              │
    └────────▶ CANCELLED ◀──┘
```

- Placing an order reserves stock immediately (status starts at `CONFIRMED`).
- An **admin** moves it forward one stage at a time from the Orders panel,
  or cancels it — from `CONFIRMED` or `PROCESSING` only.
- A **customer** can cancel their own order from "My Orders" under the same
  rule: allowed while `CONFIRMED`/`PROCESSING`, blocked once `SHIPPED`. The
  button itself only appears when cancellation is allowed, and the backend
  (`Order.updateStatus` / the `/cancel` route) enforces the identical cutoff
  independent of the UI.
- Cancelling **always** atomically restocks every vehicle in that order.

### Cart & checkout flow (frontend)

Clicking **Buy now** no longer purchases instantly — it adds the vehicle to
a client-side cart (top-right **Cart** button, with a live item-count
badge). From the cart drawer, **Proceed to Checkout** opens a form asking
for name, phone, delivery/pickup address, payment method, and optional
notes. Submitting calls `POST /api/orders`, which — in one atomic SQL
transaction — validates and decrements stock for every line item; if any
item in the cart sold out in the meantime, the *entire* order is rolled
back and the shopper sees a clear error instead of a half-completed order.
On success a confirmation screen shows the order number and summary, and
**My Orders** (header button) lists past orders — admins see every
customer's orders via the same button, labeled **All Orders**.

## Test report

_Paste the output of `npm test` (from `backend/`) here before submitting,
e.g.:_

```
Test Suites: 2 passed, 2 total
Tests:       24 passed, 24 total
```

## License

Built as a take-home kata submission. No license implied for reuse.
