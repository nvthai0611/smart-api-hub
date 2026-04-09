import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const requests = new Map<string, RateLimitInfo>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();

  let info = requests.get(ip);

  if (!info || now > info.resetTime) {
    info = { count: 1, resetTime: now + WINDOW_MS };
  } else {
    info.count++;
  }

  requests.set(ip, info);

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - info.count));

  if (info.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too Many Requests' });
  }

  next();
};
