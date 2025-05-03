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
  // Check if required environment variables are set
  if (!process.env.LEMON_SQUEEZY_API_KEY) {
    console.error('LEMON_SQUEEZY_API_KEY is not set');
    throw new Error('Lemon Squeezy API key is not configured');
  }
  
  if (!process.env.LEMON_SQUEEZY_STORE_ID) {
    console.error('LEMON_SQUEEZY_STORE_ID is not set');
    throw new Error('Lemon Squeezy store ID is not configured');
  }
  
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('NEXT_PUBLIC_APP_URL is not set');
    throw new Error('Application URL is not configured');
  }

  try {
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancelled`;

    // Log the specific success URL
    console.log("Success URL being sent:", successUrl);

    // Log the request payload for debugging
    const requestPayload = {
      data: {
        type: 'checkouts',
        attributes: {
          store_id: parseInt(process.env.LEMON_SQUEEZY_STORE_ID!, 10),
          variant_id: parseInt(variantId, 10),
          custom_data: customData || {},
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
      },
    };
    
    console.log('Sending request to Lemon Squeezy:', JSON.stringify(requestPayload, null, 2));

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Lemon Squeezy API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Failed to create checkout: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    const parsed = checkoutResponseSchema.parse(data);
    return parsed.data.attributes.url;
  } catch (error) {
    console.error('Checkout creation error:', error);
    throw error;
  }
} 