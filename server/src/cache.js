/**
 * Minimal TTL + size-bounded cache.
 * - O(1) get/set.
 * - Evicts expired entries on read.
 * - Evicts oldest entry when maxEntries exceeded.
 */
class TtlCache {
  constructor({ ttlMs, maxEntries }) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.map = new Map(); // key -> { value, expiresAt }
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value) {
    const expiresAt = Date.now() + this.ttlMs;

    // refresh insertion order for LRU-ish eviction by delete+set
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt });

    while (this.map.size > this.maxEntries) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
  }

  clear() {
    this.map.clear();
  }

  size() {
    return this.map.size;
  }
}

module.exports = { TtlCache };
