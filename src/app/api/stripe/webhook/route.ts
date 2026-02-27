import { NextRequest, NextResponse } from 'next/server'
import { handleWebhook } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  try {
    const event = await handleWebhook(body, signature)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.client_reference_id || session.metadata?.user_id
        if (!userId) break

        await supabase.from('user_plans').upsert(
          {
            user_id: userId,
            plan: 'pro',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          { onConflict: 'user_id' }
        )
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer

        // Find user by stripe_customer_id
        const { data: userPlan } = await supabase
          .from('user_plans')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userPlan) {
          const status = subscription.status
          const plan = status === 'active' ? 'pro' : 'free'

          await supabase
            .from('user_plans')
            .update({
              plan,
              current_period_start: new Date(
                subscription.current_period_start * 1000
              ).toISOString(),
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq('user_id', userPlan.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer

        const { data: userPlan } = await supabase
          .from('user_plans')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userPlan) {
          await supabase
            .from('user_plans')
            .update({ plan: 'free' })
            .eq('user_id', userPlan.user_id)
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
