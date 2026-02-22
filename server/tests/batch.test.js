const request = require('supertest');
const nock = require('nock');
const { createApp } = require('../src/app');

const TMDB_BASE = 'http://tmdb.test';

describe('GET /movies/batch', () => {
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test('validates ids parameter', async () => {
    const app = createApp({ tmdbToken: 'x', tmdbBaseUrl: TMDB_BASE });
    
    // 1. no id
    const res1 = await request(app).get('/movies/batch');
    expect(res1.statusCode).toBe(400);
    expect(res1.body.error).toMatch(/Missing 'ids'/);

    // wrong id format
    const res2 = await request(app).get('/movies/batch?ids=abc,123');
    expect(res2.statusCode).toBe(400);
    expect(res2.body.error).toMatch(/Invalid id/);
  });

  test('fetches multiple movies and handles partial failures', async () => {
    const app = createApp({ tmdbToken: 'x', tmdbBaseUrl: TMDB_BASE });


    nock(TMDB_BASE)
      .get('/movie/100')
      .query(true) // 允许任何 query (api_key 等)
      .reply(200, { id: 100, title: 'Movie 100' });


    nock(TMDB_BASE)
      .get('/movie/200')
      .query(true)
      .reply(404, { status_message: 'Not Found' });

    const res = await request(app).get('/movies/batch?ids=100,200');

    expect(res.statusCode).toBe(200);
    
 
    expect(res.body.requested).toBe(2);
    expect(res.body.resolved).toBe(1);
    expect(res.body.failed).toBe(1);
    expect(res.body.items).toHaveLength(2);

    const item100 = res.body.items.find(i => i.id === 100);
    expect(item100.ok).toBe(true);
    expect(item100.data.title).toBe('Movie 100');

    const item200 = res.body.items.find(i => i.id === 200);
    expect(item200.ok).toBe(false);
    expect(item200.error).toBeDefined();
  });

  test('uses cache for batch items', async () => {
    const app = createApp({ tmdbToken: 'x', tmdbBaseUrl: TMDB_BASE });

    // 1. cache
    nock(TMDB_BASE).get('/movie/300').query(true).reply(200, { id: 300, title: '300' });
    await request(app).get('/movies/batch?ids=300');

    // 2. cache hit
    const res = await request(app).get('/movies/batch?ids=300');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.items[0].cached).toBe(true);
    expect(res.body.items[0].data.title).toBe('300');
  });
});