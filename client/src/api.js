import axios from 'axios';

// Vite proxy forwards /movies to backend (http://localhost:5050)
const apiClient = axios.create({
  baseURL: '/movies',
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
});

export async function fetchTrendingMovies(window = 'day', page = 1) {
  const res = await apiClient.get('/trending', { params: { window, page } });
  if (res.status !== 200) throw new Error('Failed to fetch trending movies');
  return res.data; // { window, page, total_pages, results, cached }
}

export async function fetchMovieDetails(movieId) {
  const res = await apiClient.get(`/${movieId}`);
  if (res.status !== 200) throw new Error('Failed to fetch movie details');
  return res.data; // { ...movie, cached }
}

export function getImageUrl(path, size = 'w500') {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export async function fetchMoviesBatchByIds(ids) {

  const unique = Array.from(
    new Set((ids || []).map((x) => Number(x)).filter((n) => Number.isFinite(n)))
  );

  if (unique.length === 0) {
    return { requested: 0, resolved: 0, failed: 0, items: [] };
  }

  const res = await apiClient.get('/batch', { params: { ids: unique.join(',') } });
  if (res.status !== 200) throw new Error('Failed to fetch batch movie details');
  return res.data; // { requested, resolved, failed, items: [{id, ok, data?, error?}, ...] }
}

