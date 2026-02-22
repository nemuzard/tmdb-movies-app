import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { useFavorites } from './useFavorites.js';
import { fetchTrendingMovies, fetchMovieDetails, fetchMoviesBatchByIds, getImageUrl } from './api.js';

function MovieCard({ movie, onSelect, isFavorite, onToggleFavorite }) {
  const title = movie.title || movie.name || 'Untitled';
  const imageUrl = getImageUrl(movie.poster_path, 'w300');

  return (
    <div className="movie-card">
      <button className="movie-card__poster" onClick={() => onSelect(movie.id)} aria-label={`Open details for ${title}`}>
        {imageUrl ? <img src={imageUrl} alt={title} /> : <div className="no-image">No Image</div>}
      </button>

      <div className="movie-card__meta">
        <div className="movie-card__title" title={title}>{title}</div>

        <div className="movie-card__actions">
          <button
            className="favorite-btn"
            onClick={() => onToggleFavorite(movie.id)}
            aria-label={isFavorite(movie.id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite(movie.id) ? '★' : '☆'}
          </button>

          <span className="rating" aria-label="rating">
            {movie.vote_average ? movie.vote_average.toFixed(1) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

function MovieModal({ movie, onClose, isFavorite, onToggleFavorite }) {
  if (!movie) return null;
  const title = movie.title || movie.name || 'Untitled';
  const imageUrl = getImageUrl(movie.poster_path, 'w500');

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal__content">
          {imageUrl && <img className="modal__poster" src={imageUrl} alt={title} />}

          <div className="modal__details">
            <div className="modal__row">
              <button className="favorite-btn" onClick={() => onToggleFavorite(movie.id)}>
                {isFavorite(movie.id) ? '★ Favorite' : '☆ Add Favorite'}
              </button>
            </div>

            <div className="modal__row">
              <strong>Rating:</strong> {movie.vote_average ? movie.vote_average.toFixed(1) : '—'} ({movie.vote_count || 0} votes)
            </div>

            <div className="modal__row">
              <strong>Release date:</strong> {movie.release_date || '—'}
            </div>

            <div className="modal__row">
              <strong>Overview:</strong>
              <p>{movie.overview || 'No overview available.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // ✅ FIX: 将 'window' 重命名为 'timeWindow' 以避免与全局 window 对象冲突
  const [timeWindow, setTimeWindow] = useState('day'); 
  const [page, setPage] = useState(1);
  const [movies, setMovies] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedMovie, setSelectedMovie] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState(null);

  const visibleMovies = useMemo(() => {
    if (!favoritesOnly) return movies;
    return favoriteItems
      .filter((x) => x && x.ok && x.data)
      .map((x) => x.data);
  }, [favoritesOnly, movies, favoriteItems]);

  // ✅ 使用 timeWindow
  async function loadTrending(nextWindow = timeWindow, nextPage = page) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrendingMovies(nextWindow, nextPage);
      setMovies(data.results || []);
      setTotalPages(data.total_pages || 1);
    } catch (e) {
      setError(e?.message || 'Failed to load trending movies');
    } finally {
      setLoading(false);
    }
  }

  async function loadMovieDetails(movieId) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMovieDetails(movieId);
      setSelectedMovie(data);
    } catch (e) {
      setError(e?.message || 'Failed to load movie details');
    } finally {
      setLoading(false);
    }
  }

  async function loadFavoritesDetails(ids = favoriteIds) {
    setFavoritesLoading(true);
    setFavoritesError(null);
    try {
      const data = await fetchMoviesBatchByIds(ids);
      setFavoriteItems(data.items || []);
    } catch (e) {
      setFavoritesError(e?.message || 'Failed to load favorites');
      setFavoriteItems([]);
    } finally {
      setFavoritesLoading(false);
    }
  }

  // ✅ 核心初始化逻辑
  // 这里必须包含对 loadTrending 的调用
  useEffect(() => {
    if (!favoritesOnly) {
      loadTrending(timeWindow, page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeWindow, page, favoritesOnly]);

  useEffect(() => {
    if (!favoritesOnly) return;
    loadFavoritesDetails(favoriteIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoritesOnly, favoriteIds]);

  return (
    <div className="app">
      <header className="header">
        <h1>TMDB Movie App</h1>

        <div className="controls">
          <label>
            Trending:
            {/* ✅ 使用 timeWindow */}
            <select value={timeWindow} onChange={(e) => { setPage(1); setTimeWindow(e.target.value); }}>
              <option value="day">Day</option>
              <option value="week">Week</option>
            </select>
          </label>

          <label>
            Page:
            <input
              type="number"
              min="1"
              max={totalPages}
              value={page}
              onChange={(e) => setPage(Number(e.target.value) || 1)}
            />
            <span className="muted"> / {totalPages}</span>
          </label>

          <label className="checkbox">
            <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
            Favorites only
          </label>

          <span className="muted">Favorites: {favoriteIds.length}</span>

          <button className="btn" onClick={() => loadTrending()}>Refresh</button>
        </div>
      </header>

      {error && <div className="error" role="alert">{error}</div>}
      {loading && <div className="loading">Loading…</div>}
      {favoritesOnly && favoritesError && <div className="error" role="alert">{favoritesError}</div>}
      {favoritesOnly && favoritesLoading && <div className="loading">Loading favorites…</div>}
      {favoritesOnly && favoriteItems.some((x) => x && !x.ok) && (
        <div className="muted" style={{ padding: '0 16px' }}>
          Some favorites could not be loaded (deleted / unavailable upstream).
        </div>
      )}

      <main className="grid" aria-label="movie list">
        {visibleMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onSelect={loadMovieDetails}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        ))}
        
        {/* ✅ 空状态处理 */}
        {!loading && visibleMovies.length === 0 && (
           <div className="muted" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
             No movies found.
           </div>
        )}
      </main>

      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}