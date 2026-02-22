import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
// 导入具体的函数以便在测试中设置返回值
import { fetchTrendingMovies, fetchMoviesBatchByIds } from './api';

// ✅ 使用工厂模式显式定义 Mock，确保在组件加载前 Mock 已就绪
vi.mock('./api', () => ({
  fetchTrendingMovies: vi.fn(),
  fetchMoviesBatchByIds: vi.fn(),
  fetchMovieDetails: vi.fn(),
  getImageUrl: vi.fn((path) => path ? `http://img.com${path}` : null),
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders trending movies on mount (Fix Verification)', async () => {
    // 1. 设置 Mock 返回值
    const mockMovies = [
      { id: 1, title: 'Inception', poster_path: '/inc.jpg', vote_average: 8.8 },
      { id: 2, title: 'Interstellar', poster_path: '/int.jpg', vote_average: 8.6 }
    ];
    
    // 确保 fetchTrendingMovies 被调用时返回 Promise
    fetchTrendingMovies.mockResolvedValue({ 
      results: mockMovies, 
      total_pages: 1 
    });

    // 2. 渲染组件
    render(<App />);

    // 3. 验证 API 是否真的被调用了 (用于调试)
    await waitFor(() => {
      expect(fetchTrendingMovies).toHaveBeenCalled();
    });

    // 4. 验证 UI 是否更新
    await waitFor(() => {
      expect(screen.getByText('Inception')).toBeInTheDocument();
      expect(screen.getByText('Interstellar')).toBeInTheDocument();
    });
  });

  test('switches to favorites view and fetches batch details', async () => {
    // 1. 设置初始数据
    localStorage.setItem('favoriteMovies', JSON.stringify([101, 102]));
    fetchTrendingMovies.mockResolvedValue({ results: [], total_pages: 1 });
    
    const mockBatchItems = [
      { id: 101, ok: true, data: { id: 101, title: 'My Favorite Movie 1' } },
      { id: 102, ok: true, data: { id: 102, title: 'My Favorite Movie 2' } }
    ];
    fetchMoviesBatchByIds.mockResolvedValue({ items: mockBatchItems });

    render(<App />);

    // 2. 点击 "Favorites only"
    const checkbox = screen.getByLabelText(/Favorites only/i);
    fireEvent.click(checkbox);

    // 3. 验证 API 调用和 UI
    await waitFor(() => {
      expect(fetchMoviesBatchByIds).toHaveBeenCalledWith([101, 102]);
      expect(screen.getByText('My Favorite Movie 1')).toBeInTheDocument();
    });
  });

  test('handles empty state correctly', async () => {
    fetchTrendingMovies.mockResolvedValue({ results: [], total_pages: 1 });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/No movies found/i)).toBeInTheDocument();
    });
  });
});