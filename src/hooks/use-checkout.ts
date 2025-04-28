import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface UseCheckoutOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface CheckoutResponse {
  url: string;
}

export function useCheckout(options: UseCheckoutOptions = {}) {
  const router = useRouter();

  const { mutate: initiateCheckout, isPending } = useMutation({
    mutationFn: async ({ variantId, customData }: { variantId: string; customData?: Record<string, unknown> }) => {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variantId, customData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate checkout');
      }

      return response.json() as Promise<CheckoutResponse>;
    },
    onSuccess: (data) => {
      if (options.onSuccess) {
        options.onSuccess(data.url);
      } else {
        router.push(data.url);
      }
    },
    onError: (error: Error) => {
      if (options.onError) {
        options.onError(error);
      } else {
        console.error('Checkout error:', error);
      }
    },
  });

  return {
    initiateCheckout,
    isPending,
  };
} 