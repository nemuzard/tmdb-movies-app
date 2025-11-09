# TMDB Movie App

A small full-stack movie browsing application built on top of [The Movie Database (TMDB)](https://www.themoviedb.org/) API.
This project is intended as a portfolio/learning project only.

The app provides:

- Trending movie list (daily / weekly)
- Movie detail view with rating and overview
- Local “Favorites” with `localStorage`
- Node.js/Express backend proxy to TMDB
- Basic caching and Prometheus HTTP metrics for observability

---

## Features

### Frontend

- **Trending Movies**
  - Browse trending movies by:
    - **Daily** (`window=day`)
    - **Weekly** (`window=week`)
  - Grid layout with poster and title
  - Clicking a movie opens a **details view**

- **Movie Details**
  - Poster image and backdrop background
  - Title, rating (0–10), and overview
  - “Back to list” button to return to the previous list view
  - “Add to Favorites / Remove from Favorites” button

- **Favorites**
  - Favorites stored as movie IDs in `localStorage`
  - Dedicated **Favorites view** listing all favorite movies
  - Uses the backend `GET /movies/:id` endpoint to reload full movie details for each favorite ID

### Backend

- **Express API** (proxy to TMDB)
  - `GET /movies/trending`  
    - Query params:
      - `window`: `day` or `week` (defaults to `day`)
      - `page`: page number (defaults to `1`)
    - Returns an array of trending movies (20 per page from TMDB).
  - `GET /movies/:id`  
    - Returns details for a specific movie by TMDB ID.

- **Caching**
  - In-memory `Map` cache
  - Separate cache entries for:
    - trending lists: `trending_movies_${window}_${page}`
    - movie details: `movie_details_${id}`
  - Cache TTL: **60 seconds**

- **Health Check**
  - `GET /health` → `{ "status": "OK, backend is running" }`

- **Prometheus Metrics**
  - Default process metrics via `prom-client.collectDefaultMetrics()`
  - Custom metrics:
    - `http_requests_total{method,route,status_code}`
    - `http_request_duration_seconds{method,route,status_code}` (histogram)
  - Metrics endpoint:
    - `GET /metrics` returns Prometheus-compatible text

---

## Tech Stack

- **Frontend**
  - React
  - Axios
  - LocalStorage for favorites
  - Custom CSS (`index.css`)

- **Backend**
  - Node.js
  - Express
  - Axios (TMDB HTTP client)
  - `prom-client` for metrics
  - `cors`, `dotenv`

---

## Project Structure (simplified)

```text
backend/
  index.js           
  .env                 # Contains TMDB_TOKEN

frontend/
  src/
    App.jsx            # Main React application
    api.js             # Axios client for backend (/movies)
    useFavorites.js    # Custom hook for favorites
    index.css          # Styles
    main.jsx / index.jsx (React entry)

