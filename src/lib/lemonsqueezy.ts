import { createLemonSqueezy } from '@lemonsqueezy/lemonsqueezy.js';

if (!process.env.LEMON_SQUEEZY_API_KEY) {
  throw new Error('LEMON_SQUEEZY_API_KEY is not set');
}

export const lemonSqueezy = createLemonSqueezy(process.env.LEMON_SQUEEZY_API_KEY);

export const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;
export const LEMON_SQUEEZY_WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

export interface LemonSqueezyWebhookEvent {
  meta: {
    event_name: string;
  };
  data: {
    id: string;
    type: string;
    attributes: Record<string, any>;
  };
} 