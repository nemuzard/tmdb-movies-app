const dotenv = require('dotenv');
dotenv.config();

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    const err = new Error(`${name} is required`);
    err.code = 'MISSING_ENV';
    err.status = 500;
    throw err;
  }
  return v;
}

function getConfig() {
  return {
    port: Number(process.env.PORT || 5050),
    tmdbToken: process.env.TMDB_TOKEN || null,
    tmdbBaseUrl: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
    cacheTtlMs: Number(process.env.CACHE_TTL_MS || 60_000),
    cacheMaxEntries: Number(process.env.CACHE_MAX_ENTRIES || 500),
    batchMaxIds: Number(process.env.BATCH_MAX_IDS || 50),
    batchConcurrency: Number(process.env.BATCH_CONCURRENCY || 8),
  };
}

module.exports = { getConfig, requireEnv };
