/**
 * LemonSqueezy Payment Provider
 * API docs: https://docs.lemonsqueezy.com/api
 */

import type { PaymentProvider, CheckoutParams, CheckoutResult, WebhookEvent } from './types'

const LS_API = 'https://api.lemonsqueezy.com/v1'

function getConfig() {
  return {
    apiKey: process.env.LEMONSQUEEZY_API_KEY!,
    storeId: process.env.LEMONSQUEEZY_STORE_ID!,
    webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET!,
    variantId: process.env.LEMONSQUEEZY_VARIANT_ID!,
  }
}

async function lsRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
) {
  const { apiKey } = getConfig()
  const res = await fetch(`${LS_API}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) {
    const msg = data.errors?.[0]?.detail || data.message || 'LemonSqueezy API error'
    throw new Error(msg)
  }
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

export const lemonSqueezyProvider: PaymentProvider = {
  name: 'lemonsqueezy',

  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult> {
    const { storeId, variantId } = getConfig()

    const data = await lsRequest('/checkouts', 'POST', {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            custom: {
              user_id: params.userId,
              plan: params.plan,
              ...(params.metadata || {}),
            },
          },
          product_options: {
            redirect_url: params.successUrl,
          },
          checkout_options: {
            embed: false,
          },
        },
        relationships: {
          store: {
            data: { type: 'stores', id: storeId },
          },
          variant: {
            data: { type: 'variants', id: params.priceId || variantId },
          },
        },
      },
    })

    return {
      url: data.data.attributes.url,
      sessionId: data.data.id,
    }
  },

  async verifyWebhook(body: string, signature: string): Promise<WebhookEvent> {
    const { webhookSecret } = getConfig()

    const expected = await computeHmac(webhookSecret, body)
    if (expected !== signature) {
      throw new Error('Invalid webhook signature')
    }

    const event = JSON.parse(body)
    const eventName: string = event.meta?.event_name || ''
    const customData = event.meta?.custom_data || {}
    const attrs = event.data?.attributes || {}

    const typeMap: Record<string, WebhookEvent['type']> = {
      'order_created': 'checkout.completed',
      'subscription_created': 'checkout.completed',
      'subscription_updated': 'subscription.updated',
      'subscription_cancelled': 'subscription.cancelled',
      'subscription_expired': 'subscription.cancelled',
    }

    const mappedType = typeMap[eventName]
    if (!mappedType) throw new Error(`Unhandled event: ${eventName}`)

    return {
      type: mappedType,
      userId: customData.user_id || '',
      plan: mappedType === 'subscription.cancelled' ? 'free' : (customData.plan || 'pro'),
      customerId: String(attrs.customer_id || ''),
      subscriptionId: String(event.data?.id || ''),
      periodStart: attrs.created_at
        ? new Date(attrs.created_at).toISOString()
        : new Date().toISOString(),
      periodEnd: attrs.renews_at
        ? new Date(attrs.renews_at).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      raw: event,
    }
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await lsRequest(`/subscriptions/${subscriptionId}`, 'DELETE')
  },
}
