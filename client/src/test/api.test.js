import { describe, test, expect, vi } from 'vitest';
import axios from 'axios';
import { fetchMoviesBatchByIds } from '../api';

// 模拟 axios
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }))
    }
  };
});

describe('api.js', () => {
  test('fetchMoviesBatchByIds handles empty or invalid inputs', async () => {
    const result = await fetchMoviesBatchByIds([]);
    expect(result).toEqual({ requested: 0, resolved: 0, failed: 0, items: [] });

    const result2 = await fetchMoviesBatchByIds(null);
    expect(result2).toEqual({ requested: 0, resolved: 0, failed: 0, items: [] });
  });

  // 注意：由于我们在 api.js 中使用了 axios.create() 生成实例，
  // 直接测试 axios.get 可能比较麻烦。
  // 通常对于 api.js，如果它只是简单的转发请求，
  // 重点测试 App.test.jsx 的集成更重要。
  // 如果你需要测试 api.js 内部的 URL 构建逻辑，需要 mock axios instance。
});