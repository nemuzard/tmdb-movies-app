import { useEffect, useState } from "react";
import { useFavorites } from './useFavorites.js';
import { fetchTrendingMovies, fetchMovieDetails, getImageUrl } from "./api.js";

// movie card component
function MovieCard({ movie, onSelect }) {
  const title = movie.title || movie.name;
  const imageUrl = getImageUrl(movie.poster_path, 'w300');
  return (
    <div className="movie-card" onClick={() => onSelect(movie)}>
      {
        imageUrl ? (
          <img src={imageUrl} alt={title} />
        ) : (
          <div className="no-image">No Image</div>
        )
      }
      <h3>{title}</h3>
    </div>
  );
}

// movie details component
function MovieDetails({ movie, onBack, isFavorite, onToggleFavorite }) {
  if (!movie || !movie.title) {
    return (
      <div className="container">
        <button onClick={onBack} className="details-back-button">
          &larr; Back to list
        </button>

        <div className="error">
          Sorry, movie details could not be loaded.
        </div>
      </div>
    );
  }

  const imageUrl = getImageUrl(movie.poster_path, 'w500');
  const backdropUrl = getImageUrl(movie.backdrop_path, 'w1280');
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

  const isMovieFavorite = isFavorite(movie.id);
  return (
    <div className="app">
      <div
        className="movie-details-backdrop"
        style={{
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundImage: backdropUrl
            ? `linear-gradient(to bottom, rgba(30,30,30,0.8), rgba(30,30,30,1)), url(${backdropUrl})`
            : 'none'
        }}
      >
        <div className="movie-details">
          
          <button onClick={onBack}>
            &larr; Back to list
          </button>

          <div className="movie-info">
            {imageUrl ? (
              <img src={imageUrl} alt={movie.title} />
            ) : (
              <div className="no-image">No Image</div>
            )}

            <div className="details-content">
              <h2>{movie.title}</h2>

              <button
                className="details-favorite-button"
                onClick={() => onToggleFavorite(movie.id)}
              >
                {isMovieFavorite
                  ? '★ Remove from Favorites'
                  : '☆ Add to Favorites'}
              </button>

              <div className="rating">
                {rating}
                <span>/ 10</span>
              </div>

              <p>{movie.overview || 'No description available.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [windowType, setWindowType] = useState('day'); // 'day' or 'week'
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]); // for favorite movie details

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);

  const [viewMode, setViewMode] = useState('trending'); // 'trending' | 'favorites'

  // use the custom hook for favorites
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();

  // load trending movies when windowType or viewMode changes
  useEffect(() => {
    if (!movieDetails && viewMode === 'trending') {
      loadTrendingMovies(windowType);
    }
  }, [windowType, movieDetails, viewMode]);

  // load favorite movies when viewMode or favoriteIds change
  useEffect(() => {
    if (viewMode === 'favorites') {
      loadFavoriteMovies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, favoriteIds]);

  async function loadTrendingMovies(window) {
    setLoading(true);
    setError(null);
    try {
      const movies = await fetchTrendingMovies(window);
      setTrendingMovies(movies || []);
    } catch (err) {
      setError(err.message || 'Failed to load trending movies');
    } finally {
      setLoading(false);
    }
  }

  async function loadFavoriteMovies() {
    if (!favoriteIds || favoriteIds.length === 0) {
      setFavoriteMovies([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const movies = await Promise.all(
        favoriteIds.map((id) => fetchMovieDetails(id))
      );
      setFavoriteMovies(movies);
    } catch (err) {
      setError(err.message || 'Failed to load favorite movies');
    } finally {
      setLoading(false);
    }
  }

  async function loadMovieDetails(media) {
    setLoading(true);
    setError(null);
    setMovieDetails(null);
    if (media.media_type && media.media_type !== 'movie') {
      setError('Only movie details are supported.');
      setLoading(false);
      return;
    }
    try {
      const details = await fetchMovieDetails(media.id);
      if (details) {
        setMovieDetails(details);
      } else {
        setError('Movie details not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load movie details');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="app">
        <header className="app-header">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMovieDetails(null);
              setError(null);
              setViewMode('trending');
            }}
            className="logo"
          >
            MovieApp
          </a>
        </header>
        <main className="container">
          <div className="error">Error: {error}</div>
        </main>
      </div>
    );
  }

  //  DETAIL VIEW
  if (movieDetails) {
    return (
      <div className="app">
        <header className="app-header">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMovieDetails(null);
              setError(null);
              setViewMode('trending');
            }}
            className="logo"
          >
            MovieApp
          </a>
        </header>
        <MovieDetails
          movie={movieDetails}
          onBack={() => setMovieDetails(null)}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      </div>
    );
  }

  // use window-selector  
  return (
    <div className="app">
    <h1>Movies</h1>

    {/* use  window-selector */}
    <div className="window-selector">
      {/* Trending / Favorites */}
      <button
        className={viewMode === 'trending' ? 'active' : ''}
        onClick={() => setViewMode('trending')}
      >
        Trending
      </button>
      <button
        className={viewMode === 'favorites' ? 'active' : ''}
        onClick={() => setViewMode('favorites')}
      >
        Favorites
      </button>

      {/* Window type selector */}
      {viewMode === 'trending' && (
        <>
          <button
            className={windowType === 'day' ? 'active' : ''}
            onClick={() => setWindowType('day')}
          >
            Daily
          </button>
          <button
            className={windowType === 'week' ? 'active' : ''}
            onClick={() => setWindowType('week')}
          >
            Weekly
          </button>
        </>
      )}
    </div>

    {/* Trending  */}
    {viewMode === 'trending' && (
      <div className="movie-list">
        {trendingMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onSelect={loadMovieDetails}
          />
        ))}
      </div>
    )}

    {/* Favorites */}
    {viewMode === 'favorites' && (
      <div className="movie-list">
        {favoriteIds.length === 0 ? (
          <p>You have no favorite movies yet.</p>
        ) : (
          favoriteMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelect={loadMovieDetails}
            />
          ))
        )}
      </div>
    )}
    </div>
  );
}
export default App;
