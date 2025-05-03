import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { LEMON_SQUEEZY_STORE_ID } from './lemonsqueezy';

interface CreateCheckoutOptions {
  storeId: number;
  variantId: number;
  checkoutOptions?: Record<string, any>;
  checkoutData?: Record<string, any>;
  productOptions?: Record<string, any>;
  expiresAt?: string | null;
}

export async function createLemonSqueezyCheckout(options: CreateCheckoutOptions) {
  const {
    storeId,
    variantId,
    checkoutOptions,
    checkoutData,
    productOptions,
    expiresAt,
  } = options;

  return createCheckout(storeId, variantId, {
    checkoutOptions,
    checkoutData,
    productOptions,
    expiresAt,
  });
} 