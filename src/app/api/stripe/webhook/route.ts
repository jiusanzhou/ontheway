import { NextRequest, NextResponse } from 'next/server'
import { handleWebhook } from '@/lib/stripe'
import { query, queryOne } from '@/lib/db'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  try {
    const event = await handleWebhook(body, signature)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.client_reference_id || session.metadata?.user_id
        if (!userId) break

        // Upsert user_plans
        const existing = await queryOne<{ user_id: string }>(
          'SELECT user_id FROM user_plans WHERE user_id = $1',
          [userId]
        )

        if (existing) {
          await query(
            `UPDATE user_plans SET
              plan = 'pro',
              stripe_customer_id = $1,
              stripe_subscription_id = $2,
              current_period_start = $3,
              current_period_end = $4,
              updated_at = now()
            WHERE user_id = $5`,
            [
              session.customer,
              session.subscription,
              new Date().toISOString(),
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              userId,
            ]
          )
        } else {
          await query(
            `INSERT INTO user_plans (user_id, plan, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end)
             VALUES ($1, 'pro', $2, $3, $4, $5)`,
            [
              userId,
              session.customer,
              session.subscription,
              new Date().toISOString(),
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            ]
          )
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer

        const userPlan = await queryOne<{ user_id: string }>(
          'SELECT user_id FROM user_plans WHERE stripe_customer_id = $1',
          [customerId]
        )

        if (userPlan) {
          const status = subscription.status
          const plan = status === 'active' ? 'pro' : 'free'

          await query(
            `UPDATE user_plans SET
              plan = $1,
              current_period_start = $2,
              current_period_end = $3,
              updated_at = now()
            WHERE user_id = $4`,
            [
              plan,
              new Date(subscription.current_period_start * 1000).toISOString(),
              new Date(subscription.current_period_end * 1000).toISOString(),
              userPlan.user_id,
            ]
          )
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer

        const userPlan = await queryOne<{ user_id: string }>(
          'SELECT user_id FROM user_plans WHERE stripe_customer_id = $1',
          [customerId]
        )

        if (userPlan) {
          await query(
            `UPDATE user_plans SET plan = 'free', updated_at = now() WHERE user_id = $1`,
            [userPlan.user_id]
          )
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400 }
    )
  }
}
