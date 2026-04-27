/**
 * Client-side fetch wrapper with retry logic.
 *
 * Wraps all internal API calls with exponential backoff
 * and circuit breaker pattern for resilience.
 *
 * @see src/lib/resilience.ts
 */

const RETRY_CONFIG = {
  maxRetries: 2,
  initialDelay: 500,
  maxDelay: 5000,
  backoffMultiplier: 2,
};

const RETRYABLE_STATUSES = [408, 429, 500, 502, 503, 504];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Client-side fetch with automatic retry for transient errors.
 * Uses shorter delays than server-side retry (designed for browser).
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: Partial<typeof RETRY_CONFIG> = {}
): Promise<Response> {
  const cfg = { ...RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      if (!RETRYABLE_STATUSES.includes(response.status)) {
        return response; // Non-retryable, return as-is so caller can handle
      }

      if (attempt < cfg.maxRetries) {
        const delay = Math.min(
          cfg.initialDelay * Math.pow(cfg.backoffMultiplier, attempt),
          cfg.maxDelay
        );
        console.warn(
          `[client-fetch] Attempt ${attempt + 1} failed (${response.status}). Retrying in ${delay}ms...`
        );
        await sleep(delay);
      } else {
        return response; // Return last response after all retries exhausted
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < cfg.maxRetries) {
        const delay = Math.min(
          cfg.initialDelay * Math.pow(cfg.backoffMultiplier, attempt),
          cfg.maxDelay
        );
        console.warn(
          `[client-fetch] Network error on attempt ${attempt + 1}. Retrying in ${delay}ms...`
        );
        await sleep(delay);
      }
    }
  }

  throw lastError ?? new Error("All retry attempts failed");
}
