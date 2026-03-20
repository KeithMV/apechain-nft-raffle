/**
 * Rate Limiting Utilities
 * Prevent spam and abuse with configurable rate limiting
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked: boolean;
}

/**
 * Rate limiting helper class
 */
class RateLimiter {
  private attempts = new Map<string, number[]>();
  private blocked = new Map<string, number>();
  private maxAttempts: number;
  private windowMs: number;
  private blockDuration: number;

  constructor(maxAttempts: number = 10, windowMs: number = 60000, blockDuration: number = 300000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.blockDuration = blockDuration;
  }
  
  isAllowed(key: string, maxAttempts?: number, windowMs?: number): boolean {
    const now = Date.now();
    const windowStart = now - (windowMs || this.windowMs);
    const maxAllowed = maxAttempts || this.maxAttempts;
    
    // Check if currently blocked
    const blockedUntil = this.blocked.get(key);
    if (blockedUntil && now < blockedUntil) {
      return false;
    }
    
    // Remove expired block
    if (blockedUntil && now >= blockedUntil) {
      this.blocked.delete(key);
    }
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    const keyAttempts = this.attempts.get(key)!;
    
    // Remove old attempts outside the window
    const recentAttempts = keyAttempts.filter(time => time > windowStart);
    this.attempts.set(key, recentAttempts);
    
    if (recentAttempts.length >= maxAllowed) {
      // Block the key
      this.blocked.set(key, now + this.blockDuration);
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
    this.blocked.delete(key);
  }

  clear(): void {
    this.attempts.clear();
    this.blocked.clear();
  }

  getStatus(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const blockedUntil = this.blocked.get(key);
    
    if (blockedUntil && now < blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockedUntil,
        blocked: true
      };
    }
    
    const keyAttempts = this.attempts.get(key) || [];
    const recentAttempts = keyAttempts.filter(time => time > windowStart);
    const remaining = Math.max(0, this.maxAttempts - recentAttempts.length);
    
    return {
      allowed: remaining > 0,
      remaining,
      resetTime: windowStart + this.windowMs,
      blocked: false
    };
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Create a new rate limiter with custom settings
 */
export function createRateLimiter(maxAttempts: number, windowMs: number, blockDuration?: number): RateLimiter {
  return new RateLimiter(maxAttempts, windowMs, blockDuration);
}

/**
 * Simple rate limit check function
 */
export function checkRateLimit(key: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
  return rateLimiter.isAllowed(key, maxAttempts, windowMs);
}