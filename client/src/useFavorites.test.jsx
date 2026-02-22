import { describe, expect, test } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavorites } from './useFavorites.js';

describe('useFavorites', () => {
  test('initializes from localStorage and toggles', () => {
    localStorage.setItem('favoriteMovies', JSON.stringify([10]));

    const { result } = renderHook(() => useFavorites());

    expect(result.current.favoriteIds).toEqual([10]);
    expect(result.current.isFavorite(10)).toBe(true);
    expect(result.current.favoriteCount).toBe(1);

    act(() => result.current.toggleFavorite(10));
    expect(result.current.favoriteIds).toEqual([]);
    expect(result.current.favoriteCount).toBe(0);

    act(() => result.current.toggleFavorite(20));
    expect(result.current.favoriteIds).toEqual([20]);
    expect(JSON.parse(localStorage.getItem('favoriteMovies'))).toEqual([20]);
  });
  test('normalizes localStorage values (dedupe + number)', () => {
    localStorage.setItem('favoriteMovies', JSON.stringify([10, "10", 20, "bad", 20]));

    const { result } = renderHook(() => useFavorites());

    // 去重后只有 10 和 20
    expect(result.current.favoriteIds.sort((a,b)=>a-b)).toEqual([10, 20]);
    expect(result.current.favoriteCount).toBe(2);
  });

});
