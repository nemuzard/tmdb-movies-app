const express = require('express');
const cors = require('cors');

const { getConfig } = require('./config');
const { TtlCache } = require('./cache');
const { createTmdbClient } = require('./tmdbClient');
const {
  register,
  metricsMiddleware,
  recordCacheHit,
  recordCacheMiss,
  recordTmdbUpstream,
} = require('./metrics');
const { validateTrendingQuery, validateMovieId, validateBatchIds } = require('./validation');
const { mapWithConcurrency } = require('./concurrency');

function createApp(overrides = {}) {
  const cfg = { ...getConfig(), ...overrides };

  const app = express();
  // expose cfg for validators and middleware
  app.locals.cfg = cfg;

  app.use(cors());
  app.use(express.json());
  app.use(metricsMiddleware);

  const cache = new TtlCache({ ttlMs: cfg.cacheTtlMs, maxEntries: cfg.cacheMaxEntries });

  // Allow tests to inject a fake TMDB token or base URL.
  const tmdbToken = cfg.tmdbToken;
  const tmdb = createTmdbClient({ baseUrl: cfg.tmdbBaseUrl, apiKey: tmdbToken });

  app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'tmdb-movies-backend' });
  });

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // Trending movies (paged)
  app.get('/movies/trending', validateTrendingQuery, async (req, res, next) => {
    try {
      if (!tmdbToken) return res.status(500).json({ error: 'TMDB_TOKEN is not configured' });

      const { window, page } = req.validated;
      const cacheKey = `trending_${window}_${page}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        recordCacheHit('trending');
        return res.json({ ...cached, cached: true });
      }
      recordCacheMiss('trending');

      const t0 = process.hrtime.bigint();
      const response = await tmdb.getTrending({ window, page });
      const t1 = process.hrtime.bigint();
      recordTmdbUpstream('trending', response.status, Number(t1 - t0) / 1e9);

      const payload = {
        window,
        page: response.data.page,
        total_pages: response.data.total_pages,
        results: response.data.results,
      };

      cache.set(cacheKey, payload);
      res.json({ ...payload, cached: false });
    } catch (err) {
      next(err);
    }
  });



  // Batch movie details: /movies/batch?ids=123,456
  app.get('/movies/batch', validateBatchIds, async (req, res, next) => {
    try {
      if (!tmdbToken) return res.status(500).json({ error: 'TMDB_TOKEN is not configured' });

      const { ids } = req.validated;
      const concurrency = cfg.batchConcurrency || 8;

      const items = await mapWithConcurrency(ids, concurrency, async (id) => {
        const cacheKey = `movie_${id}`;
        const cached = cache.get(cacheKey);
        if (cached) {
          recordCacheHit('movie');
          return { id, ok: true, cached: true, data: cached };
        }
        recordCacheMiss('movie');

        try {
          const t0 = process.hrtime.bigint();
          const response = await tmdb.getMovieDetails({ id });
          const t1 = process.hrtime.bigint();
          recordTmdbUpstream('movie_details', response.status, Number(t1 - t0) / 1e9);

          const payload = { ...response.data };
          cache.set(cacheKey, payload);
          return { id, ok: true, cached: false, data: payload };
        } catch (e) {
          const status = e?.response?.status || 500;
          recordTmdbUpstream('movie_details', status, 0);
          return { id, ok: false, cached: false, error: 'Upstream service failure' };
        }
      });

      const resolved = items.filter((x) => x.ok).length;
      const failed = items.length - resolved;

      res.json({
        requested: ids.length,
        resolved,
        failed,
        items,
      });
    } catch (err) {
      next(err);
    }
  });
    // Movie details
  app.get('/movies/:id', validateMovieId, async (req, res, next) => {
    try {
      if (!tmdbToken) return res.status(500).json({ error: 'TMDB_TOKEN is not configured' });

      const { id } = req.validated;
      const cacheKey = `movie_${id}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        recordCacheHit('movie');
        return res.json({ ...cached, cached: true });
      }
      recordCacheMiss('movie');

      const t0 = process.hrtime.bigint();
      const response = await tmdb.getMovieDetails({ id });
      const t1 = process.hrtime.bigint();
      recordTmdbUpstream('movie_details', response.status, Number(t1 - t0) / 1e9);

      const payload = { ...response.data };
      cache.set(cacheKey, payload);
      res.json({ ...payload, cached: false });
    } catch (err) {
      next(err);
    }
  });
  // 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = status === 500 ? 'Internal Server Error' : err.message;
    if (status === 500) {
      // avoid leaking upstream details to clients
      console.error(err);
    }
    res.status(status).json({ error: message });
  });

  return app;
}

module.exports = { createApp };
