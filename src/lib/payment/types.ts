/**
 * Payment Provider Abstraction — Type Definitions
 * Supports Stripe, LemonSqueezy, and future providers.
 */

export interface PaymentProvider {
  name: string
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult>
  verifyWebhook(body: string, signature: string): Promise<WebhookEvent>
  cancelSubscription(subscriptionId: string): Promise<void>
}

export interface CheckoutParams {
  userId: string
  plan: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export interface CheckoutResult {
  url: string
  sessionId: string
}

export interface WebhookEvent {
  type: 'checkout.completed' | 'subscription.updated' | 'subscription.cancelled'
  userId: string
  plan: string
  customerId?: string
  subscriptionId?: string
  periodStart?: string
  periodEnd?: string
  raw: unknown
}
