import { z } from 'zod';

const checkoutResponseSchema = z.object({
  data: z.object({
    attributes: z.object({
      url: z.string(),
    }),
  }),
});

export async function createCheckout({
  variantId,
  customData,
}: {
  variantId: string;
  customData?: Record<string, unknown>;
}) {
  const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          store_id: process.env.LEMON_SQUEEZY_STORE_ID,
          variant_id: variantId,
          custom_data: customData,
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancelled`,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout');
  }

  const data = await response.json();
  const parsed = checkoutResponseSchema.parse(data);
  return parsed.data.attributes.url;
} 