import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

const checkoutResponseSchema = z.object({
  url: z.string().url(),
});

interface CheckoutParams {
  variantId: string;
  customData?: Record<string, unknown>;
}

async function createCheckoutSession(params: CheckoutParams) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  const data = await response.json();
  return checkoutResponseSchema.parse(data);
}

export function useCheckout() {
  return useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
} 