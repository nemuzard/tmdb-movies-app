const request = require('supertest');
const nock = require('nock');
const { createApp } = require('../src/app');

const TMDB_BASE = 'http://tmdb.test';

describe('GET /movies/trending', () => {
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test('validates query params', async () => {
    const app = createApp({ tmdbToken: 'x', tmdbBaseUrl: TMDB_BASE });
    const res = await request(app).get('/movies/trending?window=month&page=0');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Invalid 'window'/);
  });

  test('fetches trending from TMDB and caches result', async () => {
    const app = createApp({ tmdbToken: 'x', tmdbBaseUrl: TMDB_BASE, cacheTtlMs: 60_000 });

    const payload = {
      page: 1,
      total_pages: 2,
      results: [{ id: 1, title: 'Movie A' }],
    };

    const scope = nock(TMDB_BASE)
      .get('/trending/movie/day')
      .query((q) => q.api_key === 'x' && String(q.page) === '1' && q.language==='en-US')
      .reply(200, payload);

    const res1 = await request(app).get('/movies/trending?window=day&page=1');
    expect(res1.statusCode).toBe(200);
    expect(res1.body.cached).toBe(false);
    expect(res1.body.results).toHaveLength(1);

    const res2 = await request(app).get('/movies/trending?window=day&page=1');
    expect(res2.statusCode).toBe(200);
    expect(res2.body.cached).toBe(true);
    expect(res2.body.results).toHaveLength(1);

    // TMDB should have been called only once.
    expect(scope.isDone()).toBe(true);
  });

  test('handles TMDB failures without leaking details', async () => {
    const app = createApp({ tmdbToken: 'x', tmdbBaseUrl: TMDB_BASE });

    nock(TMDB_BASE)
      .get('/trending/movie/day')
      .query(true)
      .reply(500, { status_message: 'boom' });

    const res = await request(app).get('/movies/trending?window=day&page=1');
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal Server Error');
  });
});
