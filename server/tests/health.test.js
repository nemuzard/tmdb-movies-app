const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /health', () => {
  test('returns ok status', async () => {
    const app = createApp({ tmdbToken: 'test-token' });
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.service).toBe('tmdb-movies-backend');
  });
});
