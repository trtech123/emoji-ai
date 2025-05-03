export const runtime = 'nodejs'; // Force Node.js runtime for crypto module

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin'; // Import the admin client

// Define the expected structure of the webhook payload (can be refined)
interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  data: {
    type: string;
    id: string;
    attributes: {
      first_order_item?: {
        variant_id?: number;
        [key: string]: any;
      };
      [key: string]: any;
    };
    [key: string]: any;
  };
}

// Map Variant IDs to the number of credits they grant
const variantCreditMap: Record<number, number> = {
  780193: 10,   // 10 Emojis
  780206: 100,  // 100 Emojis
  780214: 1000, // 1,000 Emojis
};

export async function POST(request: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET is not set.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const rawBody = await request.text();
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signature = Buffer.from(request.headers.get('X-Signature') || '', 'utf8');

    if (!crypto.timingSafeEqual(digest, signature)) {
      console.warn('Invalid Lemon Squeezy webhook signature received.');
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
    }

    // Signature is valid, parse the body
    const payload: LemonSqueezyWebhookPayload = JSON.parse(rawBody);

    // --- Process the event --- 
    console.log('Received Lemon Squeezy Webhook:', payload.meta.event_name);
    console.log('Webhook Payload:', JSON.stringify(payload, null, 2));

    // Handle the 'order_created' event specifically for credit purchases
    if (payload.meta.event_name === 'order_created') {
      const userId = payload.meta.custom_data?.user_id;
      const variantId = payload.data.attributes.first_order_item?.variant_id;
      const orderId = payload.data.id; // Useful for logging/tracking

      console.log(`Processing order_created [Order ID: ${orderId}] for user: ${userId}, variant: ${variantId}`);

      if (!userId || typeof userId !== 'string' || !variantId) {
        console.error(`Webhook Error [Order ID: ${orderId}]: Missing or invalid user_id (${userId}) or variant_id (${variantId}) in order_created webhook`);
        // Don't retry processing this webhook, acknowledge receipt
        return NextResponse.json({ received: true, error: 'Missing or invalid user/variant ID' }); 
      }
      
      const creditsToAdd = variantCreditMap[variantId];

      if (creditsToAdd === undefined) {
        console.error(`Webhook Error [Order ID: ${orderId}]: Unknown variantId (${variantId}) received.`);
        // Acknowledge receipt, but log the issue
        return NextResponse.json({ received: true, error: 'Unknown variant ID' });
      }

      console.log(`Webhook [Order ID: ${orderId}]: Attempting to add ${creditsToAdd} credits for user ${userId}`);

      // --- Call Supabase function to update credits --- 
      const { error: rpcError } = await supabaseAdmin.rpc('increment_credits', {
        p_user_id: userId,
        p_credits_to_add: creditsToAdd
      });

      if (rpcError) {
        console.error(`Webhook Error [Order ID: ${orderId}]: Failed to increment credits for user ${userId}. Supabase RPC Error:`, rpcError);
        // Decide if this should be a 500 error to trigger Lemon Squeezy retry, 
        // or a 200 to acknowledge receipt but log the failure.
        // Returning 500 for now to encourage retry if the DB function fails.
        return NextResponse.json({ error: 'Failed to update credits.', details: rpcError.message }, { status: 500 });
      } else {
        console.log(`Webhook [Order ID: ${orderId}]: Successfully incremented credits for user ${userId} by ${creditsToAdd}`);
      }

    } else {
      console.log(`Received unhandled Lemon Squeezy event: ${payload.meta.event_name}`);
    }

    // Acknowledge receipt to Lemon Squeezy for all handled or unhandled events
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing Lemon Squeezy webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Return 500 but don't reveal specific error details potentially
    return NextResponse.json({ error: 'Webhook processing failed.', details: errorMessage }, { status: 500 }); 
  }
} 