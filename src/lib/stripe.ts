/**
 * @deprecated Use `@/lib/payment` instead.
 * Kept for backward compatibility.
 */
export { stripeProvider as default } from './payment/stripe'
export { stripeProvider } from './payment/stripe'
export type { CheckoutParams, CheckoutResult, WebhookEvent } from './payment/types'
