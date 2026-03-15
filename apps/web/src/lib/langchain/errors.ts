/**
 * Thrown when the user exceeds their daily chat usage limit.
 */
export class RateLimitError extends Error {
  readonly remaining: number;
  readonly resetAt: Date;

  constructor(remaining: number, resetAt: Date) {
    super(
      `Chat rate limit exceeded. Resets at ${resetAt.toISOString()}`
    );
    this.name = "RateLimitError";
    this.remaining = remaining;
    this.resetAt = resetAt;
  }
}

/**
 * Thrown when a user sends messages too rapidly.
 */
export class ThrottleError extends Error {
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super(`Too many requests. Retry after ${retryAfterMs}ms`);
    this.name = "ThrottleError";
    this.retryAfterMs = retryAfterMs;
  }
}
