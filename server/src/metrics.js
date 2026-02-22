const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

const cacheHitsTotal = new client.Counter({
  name: 'cache_hits_total',
  help: 'Cache hits',
  labelNames: ['type'],
  registers: [register],
});

const cacheMissesTotal = new client.Counter({
  name: 'cache_misses_total',
  help: 'Cache misses',
  labelNames: ['type'],
  registers: [register],
});

const tmdbUpstreamRequestsTotal = new client.Counter({
  name: 'tmdb_upstream_requests_total',
  help: 'TMDB upstream requests total',
  labelNames: ['endpoint', 'status_code'],
  registers: [register],
});

const tmdbUpstreamRequestDurationSeconds = new client.Histogram({
  name: 'tmdb_upstream_request_duration_seconds',
  help: 'TMDB upstream request duration in seconds',
  labelNames: ['endpoint', 'status_code'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register],
});

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const diffNs = process.hrtime.bigint() - start;
    const seconds = Number(diffNs) / 1e9;

    const route = req.route ? req.route.path : 'unknown';
    const status = String(res.statusCode);

    httpRequestsTotal.inc({ method: req.method, route, status_code: status });
    httpRequestDurationSeconds.observe({ method: req.method, route, status_code: status }, seconds);
  });

  next();
}

function recordCacheHit(type) {
  cacheHitsTotal.inc({ type });
}
function recordCacheMiss(type) {
  cacheMissesTotal.inc({ type });
}
function recordTmdbUpstream(endpoint, statusCode, durationSeconds) {
  const status = String(statusCode);
  tmdbUpstreamRequestsTotal.inc({ endpoint, status_code: status });
  tmdbUpstreamRequestDurationSeconds.observe({ endpoint, status_code: status }, durationSeconds);
}

module.exports = {
  register,
  metricsMiddleware,
  recordCacheHit,
  recordCacheMiss,
  recordTmdbUpstream,
};
