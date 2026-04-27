/**
 * Fallback Provider Manager
 *
 * Automatically switches between API providers when the primary
 * provider fails. Supports priority-based ordering and health
 * monitoring integration.
 *
 * @see skills/fallback/SKILL.md
 */

import { CircuitBreaker } from "./circuit-breaker";
import { fetchWithRetry } from "./api-retry";
import { checkApiHealth } from "./health-check";

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  models?: string[];
  priority: number;
  enabled: boolean;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class Provider {
  constructor(protected config: ProviderConfig) {}

  get name(): string {
    return this.config.name;
  }

  get enabled(): boolean {
    return this.config.enabled;
  }

  set enabled(value: boolean) {
    this.config.enabled = value;
  }

  get priority(): number {
    return this.config.priority;
  }

  async chat(_messages: ChatMessage[], _options?: ChatOptions): Promise<unknown> {
    throw new Error("Subclass must implement chat method");
  }

  async healthCheck(): Promise<boolean> {
    if (!this.config.baseUrl) return false;
    const result = await checkApiHealth(this.config.baseUrl, 5000);
    return result.healthy;
  }
}

export class FallbackManager {
  private currentProviderIndex = 0;
  private failureCount = 0;
  private readonly circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(private readonly providers: Provider[]) {
    // Create a circuit breaker for each provider
    for (const provider of providers) {
      this.circuitBreakers.set(provider.name, new CircuitBreaker({ failureThreshold: 5, timeout: 60000 }));
    }
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<unknown> {
    const enabledProviders = this.providers.filter((p) => p.enabled);
    if (enabledProviders.length === 0) {
      throw new Error("No providers available");
    }

    // Try providers in priority order, starting with current
    const orderedProviders = this.getProvidersInPriorityOrder(enabledProviders);

    for (const provider of orderedProviders) {
      try {
        const cb = this.circuitBreakers.get(provider.name);
        if (!cb) continue;

        const result = await cb.execute(async () => {
          return await provider.chat(messages, options);
        });

        // Success
        this.currentProviderIndex = this.providers.indexOf(provider);
        this.failureCount = 0;

        return result;
      } catch (error) {
        this.failureCount++;
        console.warn(`[fallback] Provider ${provider.name} failed:`, error instanceof Error ? error.message : String(error));

        if (this.failureCount >= 3) {
          this.switchToNextProvider(enabledProviders);
          this.failureCount = 0;
        }
      }
    }

    throw new Error("All providers failed");
  }

  getCurrentProvider(): Provider | undefined {
    return this.providers[this.currentProviderIndex];
  }

  getStatus(): {
    currentProvider: string;
    providers: Array<{ name: string; priority: number; enabled: boolean; circuitState: string }>;
  } {
    return {
      currentProvider: this.getCurrentProvider()?.name ?? "none",
      providers: this.providers.map((p) => ({
        name: p.name,
        priority: p.priority,
        enabled: p.enabled,
        circuitState: this.circuitBreakers.get(p.name)?.getState() ?? "UNKNOWN",
      })),
    };
  }

  private getProvidersInPriorityOrder(providers: Provider[]): Provider[] {
    const sorted = [...providers].sort((a, b) => a.priority - b.priority);
    const current = this.providers[this.currentProviderIndex];
    if (current && current.enabled) {
      const idx = sorted.indexOf(current);
      if (idx > 0) {
        sorted.splice(idx, 1);
        sorted.unshift(current);
      }
    }
    return sorted;
  }

  private switchToNextProvider(providers: Provider[]): void {
    const currentIdx = providers.indexOf(this.providers[this.currentProviderIndex]);
    const nextIdx = (currentIdx + 1) % providers.length;
    this.currentProviderIndex = this.providers.indexOf(providers[nextIdx]);
    console.log(`[fallback] Switched to provider: ${this.providers[this.currentProviderIndex].name}`);
  }
}
