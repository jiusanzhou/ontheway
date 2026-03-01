/**
 * Stripe Payment Provider
 */

import type { PaymentProvider, CheckoutParams, CheckoutResult, WebhookEvent } from './types'

const STRIPE_API = 'https://api.stripe.com/v1'

function getConfig() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    proPriceId: process.env.STRIPE_PRO_PRICE_ID!,
  }
}

async function stripeRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'POST',
  body?: Record<string, string>
) {
  const { secretKey } = getConfig()
  const res = await fetch(`${STRIPE_API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Stripe API error')
  return data
}

async function computeHmac(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export const stripeProvider: PaymentProvider = {
  name: 'stripe',

  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult> {
    const { proPriceId } = getConfig()
    const data = await stripeRequest('/checkout/sessions', 'POST', {
      'mode': 'subscription',
      'line_items[0][price]': params.priceId || proPriceId,
      'line_items[0][quantity]': '1',
      'success_url': params.successUrl,
      'cancel_url': params.cancelUrl,
      'client_reference_id': params.userId,
      'metadata[user_id]': params.userId,
      'metadata[plan]': params.plan,
      ...(params.metadata ? Object.fromEntries(
        Object.entries(params.metadata).map(([k, v]) => [`metadata[${k}]`, v])
      ) : {}),
    })
    return { url: data.url, sessionId: data.id }
  },

  async verifyWebhook(body: string, signature: string): Promise<WebhookEvent> {
    const { webhookSecret } = getConfig()
    const elements = signature.split(',')
    const timestamp = elements.find(e => e.startsWith('t='))?.slice(2)
    const sig = elements.find(e => e.startsWith('v1='))?.slice(3)
    if (!timestamp || !sig) throw new Error('Invalid signature format')

    const age = Math.abs(Date.now() / 1000 - parseInt(timestamp))
    if (age > 300) throw new Error('Webhook timestamp too old')

    const expected = await computeHmac(webhookSecret, `${timestamp}.${body}`)
    if (expected !== sig) throw new Error('Invalid webhook signature')

    const event = JSON.parse(body)
    const obj = event.data?.object

    const typeMap: Record<string, WebhookEvent['type']> = {
      'checkout.session.completed': 'checkout.completed',
      'customer.subscription.updated': 'subscription.updated',
      'customer.subscription.deleted': 'subscription.cancelled',
    }

    const mappedType = typeMap[event.type]
    if (!mappedType) throw new Error(`Unhandled event type: ${event.type}`)

    return {
      type: mappedType,
      userId: obj.client_reference_id || obj.metadata?.user_id || '',
      plan: mappedType === 'subscription.cancelled' ? 'free' : (obj.metadata?.plan || 'pro'),
      customerId: obj.customer,
      subscriptionId: obj.subscription || obj.id,
      periodStart: obj.current_period_start
        ? new Date(obj.current_period_start * 1000).toISOString()
        : new Date().toISOString(),
      periodEnd: obj.current_period_end
        ? new Date(obj.current_period_end * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      raw: event,
    }
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await stripeRequest(`/subscriptions/${subscriptionId}`, 'DELETE')
  },
}
