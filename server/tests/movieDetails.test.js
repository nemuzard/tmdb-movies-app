const request = require('supertest');
const nock = require('nock');
const { createApp } = require('../src/app');

const TMDB_BASE = 'http://tmdb.test';

describe('GET /movies/:id', () => {
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test('validates id', async () => {
    const app = createApp({ tmdbToken: 'x', tmdbBaseUrl: TMDB_BASE });
    const res = await request(app).get('/movies/abc');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/numeric/);
  });

  test('fetches details and caches', async () => {
    const app = createApp({ tmdbToken: 'x', tmdbBaseUrl: TMDB_BASE });

    const detail = { id: 550, title: 'Fight Club', vote_average: 8.4 };
    const scope = nock(TMDB_BASE)
      .get('/movie/550')
      .query((q) => q.api_key === 'x')
      .reply(200, detail);

    const res1 = await request(app).get('/movies/550');
    expect(res1.statusCode).toBe(200);
    expect(res1.body.title).toBe('Fight Club');
    expect(res1.body.cached).toBe(false);

    const res2 = await request(app).get('/movies/550');
    expect(res2.statusCode).toBe(200);
    expect(res2.body.cached).toBe(true);

    expect(scope.isDone()).toBe(true);
  });
});
