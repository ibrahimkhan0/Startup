# Requirements: StartupMeu DealFlow

## Introduction

StartupMeu DealFlow is a mini startup-investor marketplace built with the MERN stack (MongoDB, Express 4, React with Vite, Node.js). Users can browse, search, filter, create, edit and delete startup profiles and view dashboard statistics. Authentication is out of scope.

---

## Requirement 1 — Project Structure & Environment

**User Story:** As a developer, I want a clean client/server split with conventional folders, so that the codebase is easy to navigate and maintain.

### Acceptance Criteria

1.1 The project root contains a `client/` directory (React + Vite, JavaScript) and a `server/` directory (Node.js + Express), with no code shared or mixed between them.

1.2 The server contains `src/config/`, `src/models/`, `src/controllers/`, `src/routes/` and `src/middleware/`, with `server.js` as the entry point and `src/app.js` building the Express app without calling `listen`.

1.3 The client contains `src/components/`, `src/pages/` and `src/services/`.

1.4 The server uses Express 4 and CommonJS modules. `server/package.json` does not set `"type": "module"`.

1.5 `server/package.json` defines `start` (`node server.js`) and `dev` (`nodemon server.js`) scripts. `client/package.json` keeps Vite's `dev`, `build` and `preview` scripts.

1.6 Both `client/` and `server/` have a git-ignored `.env` and a committed `.env.example` that contains placeholders only.

1.7 A root `.gitignore` excludes `node_modules/`, `.env` files and build output (`dist/`, `build/`).

---

## Requirement 2 — Data Model

**User Story:** As a founder, I want my profile to capture everything an investor needs, so that my company is presented completely.

### Acceptance Criteria

2.1 The `Startup` model has: `name`, `tagline`, `description`, `industry`, `fundingStage`, `fundingRequired`, `location` (all required), `website` (optional, default `''`), plus automatic `createdAt` and `updatedAt`.

2.2 Length limits: `name` 1–100, `tagline` 1–150, `description` 10–2000, `location` 1–100, `website` at most 200 characters. String fields are trimmed.

2.3 `industry` is restricted to: `Technology`, `Healthcare`, `Finance`, `Education`, `E-commerce`, `SaaS`, `Consumer`, `Deep Tech`, `Climate Tech`, `Other`.

2.4 `fundingStage` is restricted to: `Pre-seed`, `Seed`, `Series A`, `Series B+`.

2.5 `fundingRequired` is a Number between 0 and 1,000,000,000,000 (USD).

2.6 The model defines a compound index on `industry` + `fundingStage` and no text index.

---

## Requirement 3 — Server Configuration & Security

**User Story:** As a system administrator, I want the API protected against common attacks and misconfiguration, so that it stays safe when publicly accessible.

### Acceptance Criteria

3.1 `server.js` calls `require('dotenv').config()` on its first line, before `app.js` is required.

3.2 If `MONGODB_URI` or `CLIENT_URL` is missing, the server logs which variables are missing and exits with a non-zero code before starting. `PORT` defaults to 5000.

3.3 The app registers, in order: `helmet()`, `cors` (single origin from `CLIENT_URL`, methods GET/POST/PUT/DELETE), `express.json({ limit: '10kb' })`, `express-mongo-sanitize`. Routers are mounted once in `app.js`.

3.4 Bodies larger than 10 KB are rejected with HTTP 413 `{ "message": "Request body too large" }`.

3.5 Two rate limiters are defined in `src/middleware/rateLimiter.js` and imported by the routers (never defined in `app.js`): `readLimiter` allows 100 requests per IP per 15 minutes and is applied to every GET route including the dashboard; `writeLimiter` allows 50 requests per IP per 15 minutes and is applied to POST, PUT and DELETE. Exceeding either returns HTTP 429 with JSON `{ "message": "Too many requests, please try again later" }`.

3.6 `trust proxy` is set only when the `TRUST_PROXY` environment variable is defined (for deployments behind a reverse proxy), so clients cannot spoof their IP when running without one.

3.7 No secrets or connection strings are hardcoded in source files.

---

## Requirement 4 — Server-Side Validation

**User Story:** As an API consumer, I want precise validation errors, so that I know exactly what to fix.

### Acceptance Criteria

4.1 `POST /api/startups` and `PUT /api/startups/:id` run `express-validator` rules and a shared `validate` middleware before the controller.

4.2 Text fields (`name`, `tagline`, `description`, `location`, `website`) must be strings (`.isString()`), so object or array payloads are rejected before reaching Mongoose.

4.3 Rules: `name` 1–100; `tagline` 1–150; `description` 10–2000; `location` 1–100; `industry` and `fundingStage` required and in their enums; `fundingRequired` required and a number from 0 to 1,000,000,000,000; `website` optional but, when present, at most 200 characters and a valid URL that starts with `http://` or `https://`.

4.4 A validation failure returns HTTP 422 with `{ "errors": [{ "field": "...", "message": "..." }] }` and nothing is written to the database.

4.5 A `validateId` middleware (`src/middleware/validateId.js`) checks that `req.params.id` matches `^[0-9a-fA-F]{24}$`. It is applied to `GET`, `PUT` and `DELETE` on `/api/startups/:id`. An invalid id returns HTTP 400 `{ "message": "Invalid ID format" }` before the controller runs. It is separate from `validate` (which returns 422).

---

## Requirement 5 — Central Error Handling

**User Story:** As a developer, I want every error to produce a consistent JSON response without leaking internals.

### Acceptance Criteria

5.1 `errorHandler` is the last middleware registered in `app.js`. Unmatched routes return HTTP 404 `{ "message": "Route not found" }` before it.

5.2 Unexpected errors return HTTP 500 `{ "message": "Something went wrong" }` in production; in development the real message may be returned. Stack traces are never sent to the client.

5.3 `errorHandler` maps: malformed JSON body (`entity.parse.failed`) to 400 `{ "message": "Invalid JSON body" }`; oversized body (`entity.too.large`) to 413; Mongoose `CastError` with `kind === 'ObjectId'` to 400 `{ "message": "Invalid ID format" }`; Mongoose `ValidationError` to 422 `{ "errors": [{ "field", "message" }] }` (the same shape as the `validate` middleware).

5.4 Every controller function wraps its body in `try/catch` and forwards errors with `next(err)`, because Express 4 does not catch async errors.

---

## Requirement 6 — Startup List Endpoint

**User Story:** As an investor, I want to browse startups with search and filters, so that I can find opportunities that match my focus.

### Acceptance Criteria

6.1 `GET /api/startups` returns startups sorted by `createdAt` descending in the shape `{ "data": [...], "pagination": { "page", "limit", "total", "totalPages" } }`.

6.2 `search` performs a case-insensitive partial match on `name`. The input is trimmed, limited to 100 characters, and escaped (`s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`) before being used in a `$regex`. An empty or absent value applies no search filter.

6.3 `industry` and `stage` filter by exact `industry` and `fundingStage` value. Absent or empty values apply no filter. Filters combine with each other and with `search`.

6.4 `search`, `industry` and `stage` are used only when `typeof value === 'string'`; array or object values (for example `?search=a&search=b`) are ignored rather than causing an error.

6.5 `page` defaults to 1 and is clamped to at least 1. `limit` defaults to 10 and is clamped to the range 1–50. Non-numeric values fall back to the defaults. Negative or zero values never reach MongoDB's `skip` or `limit`.

6.6 When nothing matches, the endpoint returns HTTP 200 with `data: []` and `pagination.total: 0`, never a 404.

---

## Requirement 7 — Startup Detail Endpoint

**User Story:** As an investor, I want the full details of one startup, so that I can evaluate it before reaching out.

### Acceptance Criteria

7.1 `GET /api/startups/:id` returns `{ "data": startup }` with every field, including `createdAt` and `updatedAt`.

7.2 A well-formed id that does not exist returns HTTP 404 `{ "message": "Startup not found" }`.

---

## Requirement 8 — Create Startup Endpoint

**User Story:** As a founder, I want to create a profile, so that my startup becomes visible to investors.

### Acceptance Criteria

8.1 `POST /api/startups` creates a document from only the 8 editable fields (`name`, `tagline`, `description`, `industry`, `fundingStage`, `fundingRequired`, `location`, `website`) destructured from `req.body`. Raw `req.body` is never passed to Mongoose.

8.2 On success it returns HTTP 201 with `{ "data": startup }` including `_id`, `createdAt` and `updatedAt`.

8.3 Missing or invalid fields return 422 (Requirement 4) before any database write.

---

## Requirement 9 — Update Startup Endpoint

**User Story:** As a founder, I want to edit my profile, so that it stays accurate.

### Acceptance Criteria

9.1 `PUT /api/startups/:id` is a full replacement: the client must send all 8 editable fields and the same validation as POST applies. An omitted `website` is stored as `''`.

9.2 The controller destructures only the 8 allowed fields and writes them with `$set`. `_id`, `createdAt` and any extra keys in the body are never written.

9.3 The update uses `{ new: true, runValidators: true }` and returns HTTP 200 `{ "data": updatedStartup }`.

9.4 An id that does not exist returns HTTP 404 `{ "message": "Startup not found" }`.

---

## Requirement 10 — Delete Startup Endpoint

**User Story:** As a founder, I want to remove my profile, so that outdated listings do not remain.

### Acceptance Criteria

10.1 `DELETE /api/startups/:id` permanently removes the document and returns HTTP 200 `{ "message": "Startup deleted successfully" }`.

10.2 An id that does not exist returns HTTP 404 `{ "message": "Startup not found" }`.

---

## Requirement 11 — Dashboard Stats Endpoint

**User Story:** As a platform admin, I want aggregate statistics, so that I can see the composition of the marketplace.

### Acceptance Criteria

11.1 `GET /api/dashboard/stats` returns `{ "data": { totalStartups, byIndustry, byStage, totalFundingRequired, averageFundingRequired } }`.

11.2 `byIndustry` and `byStage` are arrays of `{ "_id": name, "count": number }` sorted by count descending.

11.3 `totalFundingRequired` is the sum of `fundingRequired`. `averageFundingRequired` is the mean rounded to the nearest integer.

11.4 With an empty collection, both funding values are `0` and both arrays are empty.

11.5 The count and aggregation queries run in parallel with `Promise.all`.

---

## Requirement 12 — Frontend: Startup List Page

**User Story:** As an investor, I want a card list with live search and filters, so that I can find relevant startups quickly.

### Acceptance Criteria

12.1 `/` renders one `StartupCard` per startup (name, tagline, industry badge, stage badge, link to the detail page).

12.2 `FilterBar` provides a name search input, an industry dropdown and a funding-stage dropdown, each with an "All" option. `FilterBar` stays mounted in the loading, error and empty states.

12.3 All values that trigger a fetch (`search`, `industry`, `stage`, `page`) live in one `query` state object. Changing search, industry or stage resets `page` to 1 in the same state update, producing a single request.

12.4 The search input is debounced by 400 ms. The debounce only updates `query` when the trimmed search value actually differs from `query.search`, so the initial render does not trigger a duplicate fetch.

12.5 Each fetch uses an `AbortController`. The previous in-flight request is aborted when `query` changes or the page unmounts. An `AbortError` is ignored: it does not change `isLoading` or `error`. `.finally()` is not used to clear loading state.

12.6 Pagination is shown only when `totalPages > 1`; clicking a page number fetches that page.

12.7 States: `LoadingSpinner` while loading, `ErrorMessage` on failure, `EmptyState` when `data` is empty. When any search or filter is active, the empty state includes a "Clear filters" action that resets the search input and `query`.

---

## Requirement 13 — Frontend: Startup Detail Page

**User Story:** As an investor, I want a dedicated page per startup, so that I can read the full profile.

### Acceptance Criteria

13.1 `/startups/:id` fetches and shows name, tagline, description, industry, funding stage, funding required (USD currency, no decimals), location and website.

13.2 The website is rendered as a link only when present, with `target="_blank"` and `rel="noopener noreferrer"`.

13.3 "Edit" navigates to `/startups/:id/edit`. "Delete" asks for confirmation with `window.confirm`, disables the button while the request runs, calls the delete API, and navigates to `/` on success. A failed delete shows an error message and leaves the user on the page.

13.4 Loading and error states are shown. API status 404 or 400 shows a "Startup not found" message with a link back home.

---

## Requirement 14 — Frontend: Create & Edit Pages

**User Story:** As a founder, I want a form to create or edit a profile in the browser.

### Acceptance Criteria

14.1 `CreateStartupPage` (`/startups/new`) and `EditStartupPage` (`/startups/:id/edit`) both use the shared `StartupForm`.

14.2 `StartupForm` has text inputs for name, tagline, location and website, a textarea for description, a number input for funding required, and selects for industry and funding stage.

14.3 On submit, client-side validation mirrors the server rules (Requirement 4.3). Errors appear next to the relevant field and the API is not called while any exist. A website that is provided must start with `http://` or `https://`, with the message "Website must start with http:// or https://".

14.4 While submitting, the submit button is disabled and shows a loading indicator.

14.5 After a successful create the user is taken to the new startup's detail page; after a successful edit, to that startup's detail page.

14.6 A 422 response with `errors` maps each `{ field, message }` to the matching field. Any other failure shows a general error message above the form.

14.7 The edit page fetches the startup first and shows loading, error and not-found states before rendering the form.

---

## Requirement 15 — Frontend: Dashboard Page

**User Story:** As a platform admin, I want a dashboard of key statistics.

### Acceptance Criteria

15.1 `/dashboard` fetches `GET /api/dashboard/stats` on mount.

15.2 Four `StatCard`s show: total startups, top industry (the first entry of `byIndustry`), total funding required (USD) and average funding required (USD).

15.3 Industry and funding-stage breakdowns are shown as labelled lists with each category and its count.

15.4 Loading and error states are handled. When `totalStartups` is 0, an empty state with a link to create a startup is shown.

---

## Requirement 16 — Frontend: API Service Layer

**User Story:** As a developer, I want all network logic in one file.

### Acceptance Criteria

16.1 Every `fetch` call is in `src/services/api.js`. No page or component calls `fetch`.

16.2 The base URL comes from `VITE_API_URL` and falls back to `http://localhost:5000/api`.

16.3 The shared `request` helper:
- rethrows an `AbortError` unchanged;
- converts any other `fetch` failure to `{ status: 0, message: 'Network error — please check your connection' }`;
- throws `{ status, message: 'Unexpected server response' }` for ANY response whose `Content-Type` is not JSON, even when the status is 200;
- throws `{ status, ...body }` for non-2xx JSON responses.

16.4 Exports: `getStartups(params, signal)`, `getStartupById(id, signal)`, `createStartup(body)`, `updateStartup(id, body)`, `deleteStartup(id)`, `getDashboardStats(signal)`.

16.5 `getStartups` removes `undefined`, `null` and empty-string params before building the query string.

---

## Requirement 17 — Routing & Navigation

**User Story:** As a user, I want clear navigation and sensible behaviour for unknown URLs.

### Acceptance Criteria

17.1 Routes: `/` HomePage, `/startups/new` CreateStartupPage, `/startups/:id` StartupDetailPage, `/startups/:id/edit` EditStartupPage, `/dashboard` DashboardPage. `/startups/new` is declared so it is not captured by `/startups/:id`.

17.2 A `*` route renders `NotFoundPage` with a link home.

17.3 A top navigation bar links to Home, New Startup and Dashboard.

---

## Requirement 18 — Persistence & No Mock Data

**User Story:** As a stakeholder, I want all data stored in MongoDB.

### Acceptance Criteria

18.1 No hardcoded startup arrays or in-memory stores exist in the application code. All reads and writes use Mongoose against the live database.

18.2 The server connects using `MONGODB_URI`. If the connection fails, it logs the error and exits with a non-zero code. The server only starts listening after the connection succeeds.

18.3 An optional seed script (`server/src/seeds/seed.js`, run with `npm run seed`) inserts 10–15 sample documents into MongoDB for development. It is never imported by the app.

18.4 The seed script exits with an error before connecting to the database if `NODE_ENV === 'production'`.

---

## Requirement 19 — Documentation (README)

**User Story:** As a reviewer, I want a README that lets me run and understand the project.

### Acceptance Criteria

19.1 The README contains the eight items the assessment requires: (1) project name and description, (2) features, (3) technologies used, (4) setup and installation, (5) how to run, (6) which AI tool was used (Kiro), (7) AI Development Experience, (8) 3–5 specific tasks where the AI tool was used.

19.2 Setup covers prerequisites (Node.js >= 18, MongoDB locally or Atlas), installing both packages, copying both `.env.example` files, and the MongoDB Atlas option (`mongodb+srv://...`).

19.3 It documents all six API endpoints (method, path, description, query params) and the security measures in place.

19.4 It lists known limitations: no authentication (anyone can create, edit or delete), no image uploads, no real-time updates, no automated tests unless the optional testing task is completed.

19.5 Sections 19.1 (6)–(8) are written from actual usage at the end of the project, including AI-generated problems that were found and fixed. They are not written in advance.