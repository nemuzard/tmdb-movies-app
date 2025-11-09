
// API client for making requests to the backend
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/movies', // Proxy will forward to the Express server
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Fetch trending movies
export const fetchTrendingMovies = async (window = 'day') => {
  const response = await apiClient.get('/trending', {
    params: { window },
  });
  if (response.status !== 200) {
    throw new Error('Failed to fetch trending movies');
  }
  return response.data;
}

// Fetch movie details by ID
export const fetchMovieDetails = async (movieId) => {
  const response = await apiClient.get(`/${movieId}`);
  if (response.status !== 200) {
    throw new Error('Failed to fetch movie details');
  }
  return response.data;
}
// concatenate image URL
export const getImageUrl = (path, size = 'w500') => {
  if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
}