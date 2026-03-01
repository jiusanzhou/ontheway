/**
 * Payment Provider Factory
 *
 * Reads PAYMENT_PROVIDER env var to determine which provider to use.
 * Default: "lemonsqueezy"
 *
 * Supported: "stripe" | "lemonsqueezy"
 */

import type { PaymentProvider } from './types'

export type { PaymentProvider, CheckoutParams, CheckoutResult, WebhookEvent } from './types'

export function getPaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER || 'lemonsqueezy').toLowerCase()

  switch (provider) {
    case 'stripe': {
      const { stripeProvider } = require('./stripe')
      return stripeProvider
    }
    case 'lemonsqueezy':
    case 'lemon': {
      const { lemonSqueezyProvider } = require('./lemonsqueezy')
      return lemonSqueezyProvider
    }
    default:
      throw new Error(`Unknown payment provider: ${provider}. Supported: stripe, lemonsqueezy`)
  }
}
