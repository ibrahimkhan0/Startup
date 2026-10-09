# StartupMeu DealFlow

A mini startup-investor marketplace built with the MERN stack. Visitors can browse, search and filter startup profiles, open a detail page, create, edit and delete profiles, and see a dashboard of aggregate statistics. All data is stored in MongoDB.

## Screenshots

### Home Page
![Home page](docs/screenshots/Home.png)

### Startup Detail
![Startup Detail](docs/screenshots/Startup-Detail.png)

### Form Validation
![Form validation](docs/screenshots/form-validation.png)

### Dashboard
![Dashboard](docs/screenshots/Dashboard.png)

## Features

- List startups as cards with name, tagline, industry, funding stage, funding required, location and website
- Startup detail page with edit and delete (delete asks for confirmation)
- Create and edit profiles with a shared form, inline validation and server error messages next to each field
- Search by name (partial, case-insensitive) with a 400 ms debounce, plus filters for industry and funding stage
- Pagination (10 per page)
- Dashboard: total startups, top industry, total and average funding required, breakdown by industry and by funding stage
- Loading, empty and error states on every page, a "Clear filters" action when a search returns nothing, and a not-found page
- Validation on both client and server, with clear error messages

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite (JavaScript), React Router, Tailwind CSS v4 |
| Backend | Node.js, Express 4 (CommonJS) |
| Database | MongoDB with Mongoose (MongoDB Atlas or local) |
| API | REST, JSON |
| Server libraries | express-validator, helmet, cors, express-rate-limit, express-mongo-sanitize, dotenv, nodemon |

## Project Structure

```
.
├── .kiro/specs/startupmeu-dealflow/   # requirements.md, design.md, tasks.md (Kiro spec)
├── client/
│   └── src/
│       ├── components/    # reusable UI (StartupCard, StartupForm, FilterBar, Pagination, ...)
│       ├── pages/         # HomePage, StartupDetailPage, Create/Edit pages, DashboardPage, NotFoundPage
│       ├── services/api.js  # the only place fetch() is called
│       └── utils/         # constants, currency formatting
└── server/
    ├── server.js          # entry point: env check, DB connect, listen
    └── src/
        ├── app.js         # Express app (no listen)
        ├── config/        # db connection
        ├── models/        # Startup schema
        ├── controllers/   # startup + dashboard logic
        ├── routes/        # routers, validators, rate limiters
        ├── middleware/    # validate, validateId, rateLimiter, errorHandler
        └── seeds/         # optional sample data script
```

## Setup and Installation

### Prerequisites

- Node.js 18 or newer and npm
- A MongoDB database: either a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or MongoDB installed locally

### Install

```bash
git clone https://github.com/ibrahimkhan0/StartupMeu-DealFlow.git
cd StartupMeu-DealFlow

cd server && npm install
cd ../client && npm install
```

### Environment variables

Copy the example files and fill in your own values. The real `.env` files are git-ignored.

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**`server/.env`**

| Variable | Required | Example | Notes |
|---|---|---|---|
| `MONGODB_URI` | yes | `mongodb+srv://user:pass@cluster.mongodb.net/startupmeu?retryWrites=true&w=majority` | Atlas string, or `mongodb://localhost:27017/startupmeu` for local MongoDB |
| `CLIENT_URL` | yes | `http://localhost:5173` | The frontend origin allowed by CORS. No trailing slash. |
| `PORT` | no | `5001` | Defaults to 5000. I use 5001 because macOS AirPlay Receiver occupies 5000. |
| `NODE_ENV` | no | `development` | In `production`, error details are hidden and the seed script refuses to run. |
| `TRUST_PROXY` | no | `1` | Set only when deployed behind a reverse proxy (Render, Railway, nginx). |

**`client/.env`**

| Variable | Example | Notes |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5001/api` | Must match the server's port |

With Atlas, create a database user and add your IP address under Network Access, or the connection will time out.

### Optional: sample data

```bash
cd server
npm run seed
```

This deletes all existing startups in the configured database and inserts 15 sample startups covering every industry and funding stage. Only run it against a development database. It refuses to run when `NODE_ENV=production`.

## Running the App

Run the server and the client at the same time, in two terminals.

```bash
# Terminal 1: API (http://localhost:5001)
cd server
npm run dev

# Terminal 2: frontend (http://localhost:5173)
cd client
npm run dev
```

Open http://localhost:5173. For a production build of the frontend run `npm run build` in `client/`.

**Troubleshooting**

- `EADDRINUSE`: the port is taken. Change `PORT` in `server/.env` and `VITE_API_URL` in `client/.env`.
- Browser shows a CORS or network error: check that `CLIENT_URL` matches the exact address of the Vite dev server (including the port).
- Server exits right after start: a required variable (`MONGODB_URI`, `CLIENT_URL`) is missing, or the Atlas IP allow-list does not include your IP.

## API Reference

Base URL: `http://localhost:5001/api`

| Method | Path | Description |
|---|---|---|
| GET | `/startups` | List startups. Query params: `search`, `industry`, `stage`, `page` (default 1), `limit` (default 10, max 50) |
| GET | `/startups/:id` | Get one startup |
| POST | `/startups` | Create a startup |
| PUT | `/startups/:id` | Replace a startup (all 8 editable fields required) |
| DELETE | `/startups/:id` | Delete a startup |
| GET | `/dashboard/stats` | Totals, averages and breakdowns by industry and stage |

Startup fields: `name`, `tagline`, `description`, `industry`, `fundingStage`, `fundingRequired`, `location`, `website` (optional), plus `createdAt` and `updatedAt`.

- Industries: Technology, Healthcare, Finance, Education, E-commerce, SaaS, Consumer, Deep Tech, Climate Tech, Other
- Funding stages: Pre-seed, Seed, Series A, Series B+

**Responses**

- Lists: `{ "data": [...], "pagination": { "page", "limit", "total", "totalPages" } }`. No matches is a 200 with an empty array.
- Single, create, update: `{ "data": { ...startup } }`
- Errors: 400 invalid id or malformed JSON, 404 not found, 413 body too large, 422 validation failed (`{ "errors": [{ "field", "message" }] }`), 429 too many requests, 500 unexpected error (all as `{ "message": "..." }` except 422)

## Security

- `helmet` security headers and CORS limited to one configured origin
- Rate limiting per IP: 100 requests per 15 minutes on reads, 50 on writes, JSON 429 response
- JSON body limited to 10 KB
- `express-mongo-sanitize`, plus string-type checks on query params and `isString()` on text fields
- Search input is escaped before it is used in a regex and is limited to 100 characters
- Create and update copy only the 8 allowed fields from the request body (no mass assignment)
- Website must start with `http://` or `https://` (blocks `javascript:` links); external links use `rel="noopener noreferrer"`
- Secrets only in `.env` files; the server refuses to start if `MONGODB_URI` or `CLIENT_URL` is missing
- Stack traces and database error details are never sent to the client in production

## AI Tool Used: Kiro

I used **Kiro** (kiro.dev), not Code0.

I started in Kiro's spec mode. The prompt described the app, the stack and the security rules, and Kiro generated the requirements, design and task list. The generated files are committed in `.kiro/specs/startupmeu-dealFlow`. I reviewed the spec with Claude (Anthropic's assistant) before any code was written, and the corrections went into the spec in a few rounds, then I built the app task by task with Kiro, reading, running and committing after each task.

Kiro's monthly usage limit ran out after Task 10 (server finished, reusable components and form finished). The remaining client work (routing, the five pages and the lint fixes) was written with Claude's help. I read, ran, linted and tested that code myself. I am telling you this plainly so the commit history makes sense.

## AI Development Experience

**What worked well**

- Writing the spec first meant I knew the folder structure, API shapes and error format before any code existed, and Kiro followed them consistently.
- Boilerplate was fast: middleware, the Mongoose model, validators, the controller and 15 realistic seed startups.
- Working one task at a time kept every change small enough to read and test.

**What the AI got wrong, and what I did about it**

- Kiro's terminal tool (`execute_bash`) failed seven times in a row on Task 1. I ran the `npm` commands myself and had Kiro write files only.
- Several of Kiro's explanations were wrong or exaggerated: it said Express 4 does not support top-level `await` (it is a CommonJS limitation), it overstated the ReDoS risk of unescaped search input, and it claimed a link component gives hover styles for free. I checked claims like these instead of trusting them.
- The first version of the spec had real problems that I caught in review: name search used `$text`, which cannot match partial words; invalid ids would have caused a 500; the update endpoint passed `req.body` straight into `$set`; rate-limit errors would have been plain text; `npm install express` pulls in Express 5, which `express-mongo-sanitize` does not support; and aborted requests would have shown a fake "network error".
- Kiro left Vite's template CSS in `index.css`, which conflicts with Tailwind. I replaced it with the single Tailwind import.
- Port 5000 was already used by macOS AirPlay Receiver, so the server crashed with `EADDRINUSE`. I moved the app to port 5001.
- The first version of the form had no `id`/`htmlFor` link between labels and inputs, and server errors stayed on screen after the user fixed a field. I fixed both.
- ESLint rejected setting state synchronously inside effects (`react-hooks/set-state-in-effect`). I changed the pages to derive their loading state from the last finished request.

**Overall:** Kiro is good at structure and speed, but I had to read everything it wrote, because it was sometimes confidently wrong. Spec mode also used up my monthly credits faster than I expected, so I would plan for that next time.

## Specific Tasks Where Kiro Helped

1. **Express app, middleware order and central error handler (Task 2):** `helmet`, `cors`, body limit and sanitizing in the right order, 404 catch-all, and an error handler that maps bad JSON, oversized bodies, invalid ids and Mongoose errors to clean JSON. I tested it with malformed JSON (400) and a request from a different origin.
2. **Mongoose model and request validators (Tasks 3 and 4):** shared lists of industries and funding stages, length limits, an `isString()` check on every text field, and URL validation limited to http and https. I tested an object as a name, an empty body and a `javascript:` website.
3. **Controller with search, filters and pagination (Task 5):** an escaped case-insensitive regex, clamped `page` and `limit`, and a field whitelist on create and update. I checked `?page=-5&limit=0`, a search for `(`, and a repeated `?search=a&search=b`.
4. **Dashboard aggregation and seed data (Tasks 6 and 8):** four queries run with `Promise.all`, safe defaults on an empty collection, and a seed script that covers all industries and stages.
5. **Reusable React components and the startup form (Task 10):** cards, filter bar, pagination, empty, error and loading states, and one form used for both create and edit with client-side validation that mirrors the server rules.

## Known Limitations

- No authentication or user accounts: anyone can create, edit or delete any startup
- No image or logo uploads
- No real-time updates
- No automated tests; the API was tested manually with curl
- Rate-limit counters are kept in memory, so they reset when the server restarts and are not shared between multiple server instances
- Pagination and filter state are not stored in the URL
