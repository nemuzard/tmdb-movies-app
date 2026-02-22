# TMDB Movies App

Full-stack movie browsing app powered by The Movie Database (TMDB) API.

**What this project demonstrates (resume-focused):**
- Backend API design with validation, error handling, and in-memory caching (TTL + max-size eviction)
- Observability with Prometheus metrics (`/metrics`) and health checks (`/health`)
- Automated test suite (backend integration tests with Supertest + Nock, frontend component tests with Vitest + React Testing Library + MSW)
- Dockerized local environment (frontend + backend)

## Architecture

- **Frontend (React + Vite)**
  - Loads trending movies.
  - Opens a details modal.
  - Favorites persisted via `localStorage`.
- **Backend (Node.js + Express)**
  - Proxy layer to TMDB with caching.
  - Prometheus metrics middleware.
  - Explicit request validation.

## API

- `GET /health` -> `{ "status": "OK", "service": "tmdb-movies-backend" }`
- `GET /metrics` -> Prometheus text format
- `GET /movies/trending?window=day|week&page=1..500`
  - Returns `{ window, page, total_pages, results, cached }`
- `GET /movies/:id`
  - Returns TMDB movie object plus `cached` boolean

## Local Development

### Prerequisites
- Node.js 20+
- A TMDB API key in `TMDB_TOKEN` (this project uses it as `api_key` query param)

### Run without Docker

Backend:
```bash
cd server
npm install
TMDB_TOKEN=YOUR_TMDB_KEY npm run dev
```

Frontend:
```bash
cd client
npm install
npm run dev
```

### Run with Docker Compose

```bash
export TMDB_TOKEN=YOUR_TMDB_KEY
docker compose up --build
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5050/health`

## Tests

Backend:
```bash
cd server
npm test
npm run coverage
```

Frontend:
```bash
cd client
npm test
npm run coverage
```