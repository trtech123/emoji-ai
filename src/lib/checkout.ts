import { lemonSqueezy, LEMON_SQUEEZY_STORE_ID } from './lemonsqueezy';

interface CreateCheckoutOptions {
  variantId: number;
  customData?: Record<string, any>;
  successUrl?: string;
  cancelUrl?: string;
}

export async function createCheckout({
  variantId,
  customData = {},
  successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/success`,
  cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
}: CreateCheckoutOptions) {
  if (!LEMON_SQUEEZY_STORE_ID) {
    throw new Error('LEMON_SQUEEZY_STORE_ID is not set');
  }

  try {
    const checkout = await lemonSqueezy.createCheckout({
      storeId: parseInt(LEMON_SQUEEZY_STORE_ID),
      variantId,
      customData,
      successUrl,
      cancelUrl,
    });

    return checkout;
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
} 