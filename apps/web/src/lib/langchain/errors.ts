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
