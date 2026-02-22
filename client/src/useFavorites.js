import { useEffect, useMemo, useState } from 'react';

const FAVORITES_KEY = 'favoriteMovies';

function readFromLocalStorage() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));
    return Array.from(new Set(normalized));
  } catch {
    return [];
  }
}


function writeToLocalStorage(ids) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

// Custom hook for managing favorite movie IDs with localStorage persistence.
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(() => readFromLocalStorage());

  useEffect(() => {
    writeToLocalStorage(favoriteIds);
  }, [favoriteIds]);

  const isFavorite = (movieId) => favoriteIds.includes(movieId);

  const toggleFavorite = (movieId) => {
    setFavoriteIds((prev) => {
      if (prev.includes(movieId)) return prev.filter((id) => id !== movieId);
      return Array.from(new Set([...prev, movieId]));

    });
  };

  const favoriteCount = favoriteIds.length;

  // Useful for rendering stable lists.
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  return { favoriteIds, favoriteIdSet, favoriteCount, isFavorite, toggleFavorite };
}
