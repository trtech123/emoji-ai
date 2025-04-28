import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

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

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Checkout error response:', data);
    throw new Error(data.message || 'Failed to create checkout session');
  }

  return checkoutResponseSchema.parse(data);
}

export function useCheckout() {
  return useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create checkout');
    },
  });
} 