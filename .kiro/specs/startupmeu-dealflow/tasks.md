# Tasks: StartupMeu DealFlow

Work through the tasks in order. Implement **one top-level task at a time** and stop for review after each one. Commit after each task with a meaningful message (for example `feat(server): add startup model`).

---

## Task 1 — Server: Project Scaffold & Environment

- [x] 1.1 Create `server/` with sub-folders `src/config`, `src/models`, `src/controllers`, `src/routes`, `src/middleware`
- [x] 1.2 Run `npm init -y` in `server/`. Install `express@4` (pinned to major version 4), then `mongoose`, `dotenv`, `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`, `express-validator`. Install `nodemon` as a dev dependency. Do NOT add `"type": "module"`; the server uses CommonJS.
- [x] 1.3 Add scripts to `server/package.json`: `"start": "node server.js"` and `"dev": "nodemon server.js"`
- [x] 1.4 Create `server/.env.example` with placeholders for `PORT`, `MONGODB_URI`, `NODE_ENV`, `CLIENT_URL` and an empty `TRUST_PROXY` (with a comment that it is set to `1` only behind a reverse proxy)
- [x] 1.5 Create `server/.env` (git-ignored) with real local values; `CLIENT_URL=http://localhost:5173` with no trailing slash
- [x] 1.6 Create `server/src/config/db.js`: connect with `mongoose.connect(process.env.MONGODB_URI)` in try/catch, log success, and on failure log the error and `process.exit(1)`
- [x] 1.7 Create `server/server.js`: `require('dotenv').config()` as the very first line; exit with a clear message if `MONGODB_URI` or `CLIENT_URL` is missing; then require `connectDB` and `app`; `await connectDB()` and only then `app.listen(process.env.PORT || 5000)`
- [x] 1.8 Create a root `.gitignore` excluding `node_modules/`, `.env`, `dist/`, `build/`

_Verifies: Requirements 1, 3.1, 3.2, 3.7, 18.2_

---

## Task 2 — Server: Express App & Middleware

- [x] 2.1 Create `server/src/middleware/rateLimiter.js` exporting `readLimiter` (100 per 15 min) and `writeLimiter` (50 per 15 min). Both use `standardHeaders: true`, `legacyHeaders: false` and a `handler` returning HTTP 429 `{ message: 'Too many requests, please try again later' }`
- [x] 2.2 Create `server/src/middleware/validate.js`: collect `validationResult` errors and return 422 `{ errors: [{ field: err.path, message: err.msg }] }`
- [x] 2.3 Create `server/src/middleware/validateId.js`: test `req.params.id` against `/^[0-9a-fA-F]{24}$/`; return 400 `{ message: 'Invalid ID format' }` or call `next()`
- [x] 2.4 Create `server/src/middleware/errorHandler.js` handling, in order: `entity.parse.failed` → 400 `Invalid JSON body`; `entity.too.large` → 413 `Request body too large`; `CastError` with `kind === 'ObjectId'` → 400 `Invalid ID format`; Mongoose `ValidationError` → 422 `{ errors: [{ field, message }] }`; otherwise `err.statusCode || 500` with the message hidden when `NODE_ENV === 'production'`
- [x] 2.5 Create `server/src/app.js`: set `trust proxy` only if `process.env.TRUST_PROXY` is defined; register `helmet()`, `cors({ origin: CLIENT_URL, methods: [...] })`, `express.json({ limit: '10kb' })`, `mongoSanitize()`; mount `/api/startups` and `/api/dashboard` routers (once, here); add the 404 catch-all `{ message: 'Route not found' }`; register `errorHandler` last; `module.exports = app`
- [x] 2.6 Create stub routers `startupRoutes.js` and `dashboardRoutes.js` so the server starts

_Verifies: Requirements 3, 4.4, 4.5, 5_

---

## Task 3 — Server: Startup Model

- [x] 3.1 Create `server/src/models/Startup.js` with the full schema (all fields, required flags, trim, min/max lengths, `industry` and `fundingStage` enums, `fundingRequired` min 0 / max 1,000,000,000,000, `website` default `''`, `timestamps: true`)
- [x] 3.2 Add only the compound index `{ industry: 1, fundingStage: 1 }`; no text index
- [x] 3.3 Export the model and also export `INDUSTRIES`, `FUNDING_STAGES` and `MAX_FUNDING` so validators and the seed script share them

_Verifies: Requirement 2_

---

## Task 4 — Server: Startup Routes & Validators

- [x] 4.1 In `server/src/routes/startupRoutes.js`, define the `requiredText(field, label, { min, max })` helper and the `startupValidators` array: text fields use `.isString().bail().trim().notEmpty().bail().isLength(...)`; `industry` / `fundingStage` use `.isIn(...)`; `fundingRequired` uses `.isFloat({ min: 0, max: MAX_FUNDING }).toFloat()`; `website` is `.optional({ values: 'falsy' })` with `.isString()`, max 200, and `.isURL({ protocols: ['http', 'https'], require_protocol: true })`
- [x] 4.2 Define the five routes with their middleware chains:
  - `GET /` → `readLimiter`, `getStartups`
  - `GET /:id` → `readLimiter`, `validateId`, `getStartupById`
  - `POST /` → `writeLimiter`, `startupValidators`, `validate`, `createStartup`
  - `PUT /:id` → `writeLimiter`, `validateId`, `startupValidators`, `validate`, `updateStartup`
  - `DELETE /:id` → `writeLimiter`, `validateId`, `deleteStartup`

_Verifies: Requirements 3.5, 4, 6–10_

---

## Task 5 — Server: Startup Controller

- [x] 5.1 Create `server/src/controllers/startupController.js`
- [x] 5.2 Implement `getStartups`: clamp `page` (>= 1) and `limit` (1–50) with `Math.max` / `Math.min`; accept `search`, `industry`, `stage` only when `typeof === 'string'`, trim them and cap `search` at 100 characters; build the filter with an escaped, case-insensitive `$regex` on `name`; run `countDocuments` and the sorted, paginated `find`; return `{ data, pagination: { page, limit, total, totalPages } }`
- [x] 5.3 Implement `getStartupById`: `findById`; 404 `Startup not found` if null
- [x] 5.4 Implement `createStartup`: destructure the 8 allowed fields, `Startup.create(...)` with `website: website || ''`, return 201
- [x] 5.5 Implement `updateStartup` as a full replacement: destructure the 8 allowed fields, `findByIdAndUpdate` with `$set` of exactly those fields and `{ new: true, runValidators: true }`; 404 if null. Never write `{ $set: req.body }`
- [x] 5.6 Implement `deleteStartup`: `findByIdAndDelete`; 404 if null; return `{ message: 'Startup deleted successfully' }`
- [x] 5.7 Wrap every controller body in `try/catch` and call `next(err)`

_Verifies: Requirements 5.4, 6–10_

---

## Task 6 — Server: Dashboard Controller & Route

- [x] 6.1 Create `server/src/controllers/dashboardController.js` with `getDashboardStats` using `Promise.all` for: `countDocuments`, group-by-industry, group-by-stage, and the funding sum/average aggregate
- [x] 6.2 Handle the empty collection (`funding[0]?.… ?? 0`) and round the average with `Math.round`
- [x] 6.3 In `server/src/routes/dashboardRoutes.js` define `GET /stats` with `readLimiter`

_Verifies: Requirement 11_

---

## Task 7 — Checkpoint: Manual API Testing

Use Thunder Client, Postman or curl. Write down anything that fails and how you fixed it; these notes are useful for the README.

- [x] 7.1 `GET /api/startups`: no params (200 + pagination), `?search=` partial word (matches), `?industry=Technology`, `?stage=Seed`, combined filters, `?page=2&limit=5`
- [x] 7.2 `GET /api/startups?page=-5&limit=0` → 200 with defaults (no 500); `?search=a&search=b` → 200 (ignored); `?search=(` → 200 (escaped regex, no error)
- [x] 7.3 `POST /api/startups` with a valid body → 201 with `_id`, `createdAt`, `updatedAt`
- [x] 7.4 `POST` with missing fields → 422 with one entry per missing field; `POST` with `"name": {"a": 1}` → 422 (not a 500); `POST` with `"website": "javascript:alert(1)"` → 422
- [x] 7.5 `POST` with malformed JSON → 400 `Invalid JSON body`; `POST` with a body over 10 KB → 413
- [x] 7.6 `GET /api/startups/abc123` → 400 `Invalid ID format`; `GET` with a valid but unused ObjectId → 404 `Startup not found`
- [x] 7.7 `PUT /api/startups/:id` with a full valid body → 200 with updated values; a `PUT` containing an extra `_id` / `createdAt` key does not change them
- [x] 7.8 `DELETE /api/startups/:id` → 200, then `GET` the same id → 404
- [x] 7.9 `GET /api/dashboard/stats` → 200 with all five fields; with an empty collection → zeros and empty arrays
- [x] 7.10 `GET /api/unknown` → 404 `Route not found`
- [x] 7.11 Check the CORS origin: a request with `Origin: http://evil.example` does not receive an `Access-Control-Allow-Origin` header for that origin

_Verifies: Requirements 3–11_

---

## Task 8 — Seed Script *(optional)*

- [x] 8.1 Create `server/src/seeds/seed.js`: the first statement exits with an error if `process.env.NODE_ENV === 'production'`; then load `dotenv`, call `connectDB()`, `deleteMany` the startups, `insertMany` 10–15 realistic sample startups covering all 10 industries and all 4 funding stages, then disconnect
- [x] 8.2 Add `"seed": "node src/seeds/seed.js"` to `server/package.json`
- [x] 8.3 Run it once against your local development database and check the documents in MongoDB

_Verifies: Requirement 18.3, 18.4_

---

## Task 9 — Client: Scaffold, Tailwind & API Service

- [x] 9.1 Create the app: `npm create vite@latest client -- --template react` (JavaScript)
- [x] 9.2 Install Tailwind CSS v4 with the Vite plugin: `npm install tailwindcss @tailwindcss/vite`; add the plugin to `vite.config.js` and put `@import "tailwindcss";` in `src/index.css`. Do not create a `tailwind.config.js`
- [x] 9.3 Install `react-router-dom`
- [x] 9.4 Create `client/.env.example` with `VITE_API_URL=http://localhost:5000/api`, and a git-ignored `client/.env` with the same value
- [x] 9.5 Create `src/utils/constants.js` (`INDUSTRIES`, `FUNDING_STAGES`, matching the server lists) and `src/utils/format.js` (`formatUSD` using `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })`)
- [x] 9.6 Create `src/services/api.js` with `buildQueryString` (drops empty params), the `request` helper (rethrows `AbortError` unchanged; network failure → `{ status: 0, message }`; ANY non-JSON response throws `Unexpected server response`, even on 200; non-2xx JSON throws `{ status, ...body }`) and the six exports: `getStartups(params, signal)`, `getStartupById(id, signal)`, `createStartup`, `updateStartup`, `deleteStartup`, `getDashboardStats(signal)`

_Verifies: Requirements 1, 16_

---

## Task 10 — Client: Reusable Components

- [x] 10.1 `LoadingSpinner.jsx` — centered animated spinner
- [x] 10.2 `EmptyState.jsx` — `message` prop and optional `action` (label + handler) button
- [x] 10.3 `ErrorMessage.jsx` — `message` prop in a styled error box
- [x] 10.4 `StatCard.jsx` — `label` and `value` props
- [x] 10.5 `StartupCard.jsx` — name, tagline, industry badge, stage badge, link to the detail page
- [x] 10.6 `FilterBar.jsx` — controlled search input plus industry and stage selects, each with an "All" option
- [x] 10.7 `Pagination.jsx` — `page`, `totalPages`, `onPageChange`; renders nothing when `totalPages <= 1`
- [x] 10.8 `StartupForm.jsx` — props `initialData`, `onSubmit`, `isLoading`, `serverErrors`, `submitLabel`; all 8 fields; `validateForm()` mirroring the server rules (including the `http(s)` website check via `new URL()` and the funding range); per-field error messages; disabled submit button with a loading indicator while submitting; converts `fundingRequired` to a Number before calling `onSubmit`

_Verifies: Requirements 12–15_

---

## Task 11 — Client: Routing & Layout

- [x] 11.1 Update `src/App.jsx` with `BrowserRouter`, `Routes` and a shared layout containing the top navigation bar (Home, New Startup, Dashboard)
- [x] 11.2 Define routes: `/`, `/startups/new`, `/startups/:id`, `/startups/:id/edit`, `/dashboard`
- [x] 11.3 Create `NotFoundPage.jsx` and add the `*` route

_Verifies: Requirement 17_

---

## Task 12 — Client: Home Page

- [x] 12.1 Create `src/pages/HomePage.jsx` with state `searchInput`, `query { search, industry, stage, page }`, `startups`, `pagination`, `isLoading`, `error`
- [x] 12.2 Debounce effect: after 400 ms, `setQuery(prev => prev.search === value ? prev : { ...prev, search: value, page: 1 })` where `value = searchInput.trim()`
- [x] 12.3 Fetch effect on `[query]`: create an `AbortController`, call `getStartups(query, controller.signal)`; on success set data and `isLoading(false)`; in `catch`, return immediately on `AbortError`, otherwise set `error` and `isLoading(false)`; cleanup calls `controller.abort()`. Do not use `.finally()`
- [x] 12.4 Industry / stage handlers set the value and `page: 1` in one `setQuery`; pagination handler only sets `page`
- [x] 12.5 Render order: `FilterBar` always visible; then `LoadingSpinner`, `ErrorMessage`, `EmptyState` (with a "Clear filters" action when a search or filter is active) or the grid of `StartupCard`s followed by `Pagination`

_Verifies: Requirement 12_

---

## Task 13 — Client: Startup Detail Page

- [x] 13.1 Create `src/pages/StartupDetailPage.jsx`; read `id` with `useParams` and fetch with `getStartupById(id, signal)` (abort on cleanup)
- [x] 13.2 Show all fields; format funding with `formatUSD`; render the website as `<a target="_blank" rel="noopener noreferrer">` only when it is non-empty
- [x] 13.3 "Edit" navigates to `/startups/:id/edit`; "Delete" uses `window.confirm`, disables itself while deleting, navigates to `/` on success and shows an error message on failure
- [x] 13.4 Handle loading, generic error, and 404/400 ("Startup not found" with a link home)

_Verifies: Requirement 13_

---

## Task 14 — Client: Create Startup Page

- [x] 14.1 Create `src/pages/CreateStartupPage.jsx` rendering `StartupForm` with empty initial data
- [x] 14.2 On submit call `createStartup(values)` and navigate to `/startups/${res.data._id}`
- [x] 14.3 Map a 422 `errors` array to `serverErrors` for per-field display; show any other error in a banner above the form

_Verifies: Requirement 14_

---

## Task 15 — Client: Edit Startup Page

- [x] 15.1 Create `src/pages/EditStartupPage.jsx`; fetch the startup first and handle loading, error and not-found states
- [x] 15.2 Render `StartupForm` with the fetched startup as `initialData`
- [x] 15.3 On submit call `updateStartup(id, values)` and navigate to `/startups/:id`; handle 422 and general errors as in Task 14

_Verifies: Requirement 14_

---

## Task 16 — Client: Dashboard Page

- [x] 16.1 Create `src/pages/DashboardPage.jsx`; fetch `getDashboardStats(signal)` on mount; handle loading and error states
- [x] 16.2 If `totalStartups === 0`, show an `EmptyState` with a link to create a startup
- [x] 16.3 Otherwise render four `StatCard`s (total startups, top industry from `byIndustry[0]`, total funding, average funding, both via `formatUSD`)
- [x] 16.4 Render the industry breakdown and funding-stage breakdown as labelled lists with counts

_Verifies: Requirement 15_

---

## Task 17 — Checkpoint: End-to-End Check

- [x] 17.1 Run server and client together. Walk through: seed or create startups → search by partial name → filter by industry and stage → paginate → open a detail page → edit → delete → dashboard
- [x] 17.2 Type quickly in the search box and confirm the network tab shows one request per pause and no error flashes
- [x] 17.3 Stop the server and confirm the UI shows "Network error — please check your connection"
- [x] 17.4 Visit `/startups/abc` and `/nothing-here` and confirm both show a sensible not-found page
- [x] 17.5 Submit the form empty and with a bad website; confirm inline errors and that no request is sent. Then bypass the client check (curl) and confirm the server's 422 errors appear next to the right fields in the UI
- [x] 17.6 Run `npm run build` in `client/` and confirm it succeeds

_Verifies: Requirements 12–17_

---

## Task 18 — README

Sections marked *(write at the end)* must be written from your real experience with Kiro, not in advance.

- [x] 18.1 Create `README.md` at the project root: project name and one-paragraph description, and a feature list (startup CRUD, search, filters, pagination, dashboard stats, validation, loading / empty / error states)
- [x] 18.2 Technologies used: React, Vite, Tailwind CSS v4, React Router, Node.js >= 18, Express 4, MongoDB, Mongoose, express-validator, helmet, cors, express-rate-limit, express-mongo-sanitize
- [x] 18.3 Setup and installation: prerequisites (Node.js >= 18, local MongoDB or an Atlas account), clone, `npm install` in `server/` and `client/`, copy both `.env.example` files to `.env` and fill them in, and the Atlas option (`mongodb+srv://...` in `MONGODB_URI`); mention `npm run seed` as an optional step
- [x] 18.4 How to run: `npm run dev` in `server/` (port 5000) and in `client/` (port 5173), both at the same time; include the production notes `TRUST_PROXY=1` and `CLIENT_URL`
- [x] 18.5 API reference table for all six endpoints with query parameters, and the standard error responses
- [x] 18.6 Security measures section (helmet, restricted CORS, split rate limiting, 10 KB body limit, mongo sanitization, escaped search regex, field whitelisting, env-var secrets)
- [x] 18.7 *(write at the end)* **AI tool used:** state that Kiro was used, and how its spec workflow (requirements, design, tasks) and `.kiro/` folder were used
- [x] 18.8 *(write at the end)* **AI Development Experience:** what worked well, what the AI got wrong, and how you found and fixed it
- [x] 18.9 *(write at the end)* **3–5 specific tasks** where Kiro helped (for example component development, API creation, debugging, database integration, refactoring), each with a concrete example from your own work
- [x] 18.10 Known limitations: no authentication (anyone can create, edit or delete), no image uploads, no real-time updates, no automated tests unless Task 19 is completed
- [x] 18.11 Add screenshots of the home page, detail page, form and dashboard

_Verifies: Requirement 19_

---

## Task 19 — Automated API Tests *(optional)*

- [ ] 19.1 Install `jest`, `supertest` and `mongodb-memory-server` as dev dependencies in `server/`; add a `"test": "jest"` script. Tests import `src/app.js` (which does not call `listen`)
- [ ] 19.2 Write 4–6 tests: create + fetch a startup, 422 on invalid body, 400 on malformed id, 404 on unknown id, filtering by industry, and dashboard totals
- [ ] 19.3 If this task is completed, update the "Known limitations" section of the README accordingly

_Verifies: Overall code quality_
