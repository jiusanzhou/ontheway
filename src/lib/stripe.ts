// Stripe integration using raw fetch (no stripe npm package needed)

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!
const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!

const STRIPE_API = 'https://api.stripe.com/v1'

async function stripeRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: Record<string, string>
) {
  const res = await fetch(`${STRIPE_API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message || 'Stripe API error')
  }
  return data
}

export async function createCheckoutSession(
  userId: string,
  plan: string,
  successUrl: string,
  cancelUrl: string
) {
  const data = await stripeRequest('/checkout/sessions', 'POST', {
    'mode': 'subscription',
    'line_items[0][price]': STRIPE_PRO_PRICE_ID,
    'line_items[0][quantity]': '1',
    'success_url': successUrl,
    'cancel_url': cancelUrl,
    'client_reference_id': userId,
    'metadata[user_id]': userId,
    'metadata[plan]': plan,
  })

  return data
}

// Verify Stripe webhook signature using Web Crypto API
async function computeHmac(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<boolean> {
  const elements = signature.split(',')
  const timestamp = elements.find((e) => e.startsWith('t='))?.slice(2)
  const sig = elements.find((e) => e.startsWith('v1='))?.slice(3)

  if (!timestamp || !sig) return false

  // Check timestamp tolerance (5 minutes)
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp))
  if (age > 300) return false

  const payload = `${timestamp}.${body}`
  const expected = await computeHmac(STRIPE_WEBHOOK_SECRET, payload)

  return expected === sig
}

export async function handleWebhook(body: string, signature: string) {
  const valid = await verifyWebhookSignature(body, signature)
  if (!valid) {
    throw new Error('Invalid webhook signature')
  }

  const event = JSON.parse(body)
  return event
}

export { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PRICE_ID }
