const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const client = require('prom-client');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());

// Prometheus metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
const register = client.register;
collectDefaultMetrics();

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration= new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 1, 2, 5]
});

function metricsMiddleware(req, res, next) {
    const route = req.route ? req.route.path : req.path;
    const method = req.method;

    const end = httpRequestDuration.startTimer({ method, route });
    res.on('finish', () => {
        const statusCode = res.statusCode;
        httpRequestCounter.inc({ method, route, status_code: statusCode });
        end({ status_code: statusCode });
    });
    
    next();

}

app.use(metricsMiddleware);

// check token setup
if (!process.env.TMDB_TOKEN) {
    console.error("Error: TMDB_TOKEN is not set in environment variables.");
    process.exit(1);
}
// tmdb client setup
const tmdbClient = axios.create({
    baseURL: 'https://api.themoviedb.org/3',
    // headers: {
    //     Authorization: `Bearer ${process.env.TMDB_TOKEN}`
    // }
});

//cache setup
const cache = new Map();
const CACHE_DURATION =  60 * 1000; // 1 minute

function getCache(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
        cache.delete(key);
        return null;
    }
    return entry.value;
}

function setCache(key, value) {
    const expiry = Date.now() + CACHE_DURATION;
    cache.set(key, { value, expiry });
}

// Routes
app.get('/movies/trending', async (req, res) => {
    const window = req.query.window === 'week' ? 'week' : 'day'; // 'day' or 'week'
    const  MAX_PAGES= 5;
    const cacheKey = `trending_movies_${window}_${MAX_PAGES}`;


    const cached = getCache(cacheKey);
    if (cached) {
        return res.json(cached);
    }

    try {
        let allMovies = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages && page <= MAX_PAGES) {
            const response = await tmdbClient.get(`/trending/movie/${window}`,{
                params: {
                    api_key: process.env.TMDB_TOKEN,
                    language: 'en-US',
                    page: page || 1
            }   
        });

            const movies = response.data.results;
            allMovies = allMovies.concat(movies);
            totalPages = response.data.total_pages;
            page++;
        }

        setCache(cacheKey, allMovies);
        res.json(allMovies);
    } catch (error) {
        console.error("Error fetching trending movies:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// movie details
app.get('/movies/:id', async (req, res) => {
    const movieId = req.params.id;
    const cacheKey = `movie_details_${movieId}`;   
    const cached = getCache(cacheKey);
    if (cached) {
        return res.json(cached);
    }

    try {
        const response = await tmdbClient.get(`/movie/${movieId}`,{
            params: {
                api_key: process.env.TMDB_TOKEN,
                language: 'en-US'
            }
        });

        const movieDetails = response.data;
        setCache(cacheKey, movieDetails);
        res.json(movieDetails);
    } catch (error) {
        console.error("Error fetching movie details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK, backend is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});