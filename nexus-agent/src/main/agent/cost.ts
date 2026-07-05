/**
 * v1.0 cost tracking — Anthropic pricing per million tokens.
 *
 * Pricing source: Product-Spec §11.6 (snapshot 2026-07-05).
 *
 * Formula:
 *   usd = (input_tokens        * model.input
 *        + output_tokens       * model.output
 *        + cache_create_tokens * model.cacheWrite5m
 *        + cache_read_tokens   * model.cacheRead) / 1_000_000
 *
 * `computeCost` returns `null` for unknown models or fully empty usage —
 * callers should not persist `null` as a recorded cost. Treat each token
 * bucket as 0 when its SDK field is `null`.
 *
 * Spec edge cases:
 *   - Claude Sonnet 5 output is $2 / MTok until 2026-09-01 (promo); after
 *     that it reverts to the headline $15 / MTok. We branch on the current
 *     UTC date.
 */

import type { StreamUsage } from './types'

export interface ModelPricing {
  input: number
  output: number
  cacheWrite5m: number
  cacheRead: number
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-3-5-sonnet-20241022': {
    input: 3.0,
    output: 15.0,
    cacheWrite5m: 3.75,
    cacheRead: 0.3,
  },
  'claude-sonnet-4-6': {
    input: 3.0,
    output: 15.0,
    cacheWrite5m: 3.75,
    cacheRead: 0.3,
  },
  'claude-sonnet-5': {
    input: 3.0,
    output: 15.0,
    cacheWrite5m: 3.75,
    cacheRead: 0.3,
  },
  'claude-haiku-4-5': {
    input: 1.0,
    output: 5.0,
    cacheWrite5m: 1.25,
    cacheRead: 0.1,
  },
  'claude-opus-4-8': {
    input: 5.0,
    output: 25.0,
    cacheWrite5m: 6.25,
    cacheRead: 0.5,
  },
  'claude-fable-5': {
    input: 10.0,
    output: 50.0,
    cacheWrite5m: 12.5,
    cacheRead: 1.0,
  },
}

const SONNET_5_OUTPUT_HEADLINE = 15.0
const SONNET_5_OUTPUT_PROMO = 2.0
const SONNET_5_PROMO_END = Date.UTC(2026, 8, 1) // 2026-09-01T00:00:00Z (months are 0-indexed)

export function computeCost(model: string, usage: StreamUsage, now: Date = new Date()): number | null {
  const pricing = MODEL_PRICING[model]
  if (!pricing) return null

  const outputPrice = priceForSonnet5Output(model, pricing.output, now)
  const inputTokens = usage.inputTokens
  const outputTokens = usage.outputTokens
  const cacheWrite = usage.cacheCreationInputTokens ?? 0
  const cacheRead = usage.cacheReadInputTokens ?? 0

  const totalUsd =
    (inputTokens * pricing.input +
      outputTokens * outputPrice +
      cacheWrite * pricing.cacheWrite5m +
      cacheRead * pricing.cacheRead) /
    1_000_000

  return Math.round(totalUsd * 1_000_000) / 1_000_000
}

export function computeCostFromRaw(
  model: string,
  buckets: {
    inputTokens: number
    outputTokens: number
    cacheCreationTokens: number | null
    cacheReadTokens: number | null
  },
  now: Date = new Date(),
): number | null {
  return computeCost(
    model,
    {
      inputTokens: buckets.inputTokens,
      outputTokens: buckets.outputTokens,
      cacheCreationInputTokens: buckets.cacheCreationTokens,
      cacheReadInputTokens: buckets.cacheReadTokens,
    },
    now,
  )
}

function priceForSonnet5Output(model: string, headline: number, now: Date): number {
  if (model !== 'claude-sonnet-5') return headline
  return now.getTime() < SONNET_5_PROMO_END ? SONNET_5_OUTPUT_PROMO : SONNET_5_OUTPUT_HEADLINE
}
