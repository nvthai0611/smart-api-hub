interface CacheItem {
  data: any;
  expiry: number;
}

const cache = new Map<string, CacheItem>();
const TTL = 30 * 1000; // 30 seconds

export const getCache = (key: string) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

export const setCache = (key: string, data: any) => {
  cache.set(key, { data, expiry: Date.now() + TTL });
};

export const invalidateCache = (resource: string) => {
  for (const key of cache.keys()) {
    if (key.startsWith(resource)) {
      cache.delete(key);
    }
  }
};
