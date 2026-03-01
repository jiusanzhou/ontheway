import { NextRequest, NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payment'
import { query, queryOne } from '@/lib/db'

export async function POST(request: NextRequest) {
  const body = await request.text()

  // Get signature from appropriate header based on provider
  const provider = getPaymentProvider()
  const signature =
    request.headers.get('x-signature') ||       // LemonSqueezy
    request.headers.get('stripe-signature') ||   // Stripe
    ''

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  try {
    const event = await provider.verifyWebhook(body, signature)

    switch (event.type) {
      case 'checkout.completed': {
        if (!event.userId) break

        const existing = await queryOne<{ user_id: string }>(
          'SELECT user_id FROM user_plans WHERE user_id = $1',
          [event.userId]
        )

        if (existing) {
          await query(
            `UPDATE user_plans SET
              plan = $1,
              stripe_customer_id = $2,
              stripe_subscription_id = $3,
              current_period_start = $4,
              current_period_end = $5,
              updated_at = now()
            WHERE user_id = $6`,
            [event.plan, event.customerId, event.subscriptionId,
             event.periodStart, event.periodEnd, event.userId]
          )
        } else {
          await query(
            `INSERT INTO user_plans (user_id, plan, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [event.userId, event.plan, event.customerId, event.subscriptionId,
             event.periodStart, event.periodEnd]
          )
        }
        break
      }

      case 'subscription.updated': {
        if (!event.customerId) break

        const userPlan = await queryOne<{ user_id: string }>(
          'SELECT user_id FROM user_plans WHERE stripe_customer_id = $1',
          [event.customerId]
        )

        if (userPlan) {
          await query(
            `UPDATE user_plans SET
              plan = $1,
              current_period_start = $2,
              current_period_end = $3,
              updated_at = now()
            WHERE user_id = $4`,
            [event.plan, event.periodStart, event.periodEnd, userPlan.user_id]
          )
        }
        break
      }

      case 'subscription.cancelled': {
        if (!event.customerId) break

        const userPlan2 = await queryOne<{ user_id: string }>(
          'SELECT user_id FROM user_plans WHERE stripe_customer_id = $1',
          [event.customerId]
        )

        if (userPlan2) {
          await query(
            `UPDATE user_plans SET plan = 'free', updated_at = now() WHERE user_id = $1`,
            [userPlan2.user_id]
          )
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
