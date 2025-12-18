export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelayMs?: number
    backoffMultiplier?: number
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelayMs = 1000, backoffMultiplier = 2 } = options
  let lastError: unknown

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === maxRetries - 1) {
        throw error
      }
      // Exponential backoff: 1000ms, 2000ms, 4000ms, etc.
      const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // This satisfies TypeScript - lastError is guaranteed to be set if we reach here
  throw lastError
}
