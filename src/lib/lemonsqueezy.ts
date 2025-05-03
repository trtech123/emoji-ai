import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';

const apiKey = process.env.LEMONSQUEEZY_API_KEY;

if (!apiKey) {
  // In production, you might want to throw an error or handle this differently.
  // For development, this log helps diagnose missing environment variables.
  console.warn(
    'LEMONSQUEEZY_API_KEY is not defined in environment variables. \n' +
    'Lemon Squeezy client will not be initialized. \n' +
    'Ensure the variable is set in your .env.local file and the server is restarted.'
  );
  // Provide a dummy object or throw error based on your needs
  // throw new Error('Lemon Squeezy API Key is missing.'); 
}

lemonSqueezySetup({ apiKey });

export { createCheckout };

// Optional: Add a check function if needed elsewhere
export function isLemonSqueezyConfigured(): boolean {
  return !!apiKey;
}

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