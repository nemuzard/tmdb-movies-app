const axios = require('axios');

function createTmdbClient({ baseUrl, apiKey }) {
  const instance = axios.create({
    baseURL: baseUrl,
    timeout: 10_000,
  });

  async function getTrending({ window, page }) {
    return instance.get(`/trending/movie/${window}`, {
      params: {
        api_key: apiKey,
        language: 'en-US',
        page,
      },
    });
  }

  async function getMovieDetails({ id }) {
    return instance.get(`/movie/${id}`, {
      params: {
        api_key: apiKey,
        language: 'en-US',
      },
    });
  }

  return { getTrending, getMovieDetails };
}

module.exports = { createTmdbClient };
