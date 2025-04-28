import { useState } from 'react';

interface UseCheckoutOptions {
  variantId: number;
  customData?: Record<string, any>;
  successUrl?: string;
  cancelUrl?: string;
}

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCheckout = async ({
    variantId,
    customData,
    successUrl,
    cancelUrl,
  }: UseCheckoutOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId,
          customData,
          successUrl,
          cancelUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Lemon Squeezy checkout URL
      window.location.href = data.data.attributes.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initiateCheckout,
    isLoading,
    error,
  };
} 