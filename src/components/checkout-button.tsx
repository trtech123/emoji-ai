import { Button } from 'tamagui';
import { useCheckout } from '@/hooks/use-checkout';

interface CheckoutButtonProps {
  variantId: string;
  customData?: Record<string, unknown>;
  children: React.ReactNode;
}

export function CheckoutButton({ variantId, customData, children }: CheckoutButtonProps) {
  const { mutate: initiateCheckout, isPending } = useCheckout();

  return (
    <Button
      onPress={() => initiateCheckout({ variantId, customData })}
      disabled={isPending}
      loading={isPending}
    >
      {children}
    </Button>
  );
} 