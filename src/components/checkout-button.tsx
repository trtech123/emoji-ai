import { Button } from "@/components/ui/button";
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
      onClick={() => initiateCheckout({ variantId, customData })}
      disabled={isPending}
    >
      {children}
    </Button>
  );
} 