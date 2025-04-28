import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createHmac } from 'crypto';
import { LEMON_SQUEEZY_WEBHOOK_SECRET, type LemonSqueezyWebhookEvent } from '@/lib/lemonsqueezy';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('x-signature');

    if (!signature || !LEMON_SQUEEZY_WEBHOOK_SECRET) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify webhook signature
    const hmac = createHmac('sha256', LEMON_SQUEEZY_WEBHOOK_SECRET);
    hmac.update(body);
    const calculatedSignature = hmac.digest('hex');

    if (signature !== calculatedSignature) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body) as LemonSqueezyWebhookEvent;

    // Handle different webhook events
    switch (event.meta.event_name) {
      case 'subscription_created':
        // Handle subscription creation
        console.log('Subscription created:', event.data);
        break;
      case 'subscription_updated':
        // Handle subscription update
        console.log('Subscription updated:', event.data);
        break;
      case 'subscription_cancelled':
        // Handle subscription cancellation
        console.log('Subscription cancelled:', event.data);
        break;
      default:
        console.log('Unhandled event:', event.meta.event_name);
    }

    return new NextResponse('Webhook processed', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Webhook error', { status: 500 });
  }
} 