/**
 * P-MAS Resilience Layer
 *
 * Unified exports for the API resilience toolkit integrated from agent-toolkit.
 * Provides retry logic, circuit breaker, health checking, and fallback management.
 *
 * Usage:
 *   import { fetchWithRetry, CircuitBreaker, checkApiHealth, FallbackManager } from '@/lib/resilience';
 */

export { fetchWithRetry, defaultRetryConfig } from "./api-retry";
export type { RetryConfig } from "./api-retry";

export { CircuitBreaker, defaultCircuitBreakerConfig } from "./circuit-breaker";
export type { CircuitState, CircuitBreakerConfig } from "./circuit-breaker";

export {
  checkApiHealth,
  checkMultipleEndpoints,
  FailureTracker,
  ResponseTimeMonitor,
  defaultHealthMonitorConfig,
} from "./health-check";
export type { HealthCheckResult, HealthMonitorConfig } from "./health-check";

export { Provider, FallbackManager } from "./fallback-manager";
export type { ProviderConfig, ChatMessage, ChatOptions } from "./fallback-manager";
