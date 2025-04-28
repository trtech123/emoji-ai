import { useCheckout } from '@/hooks/use-checkout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDialog({ isOpen, onOpenChange }: PaymentDialogProps) {
  const checkout = useCheckout();

  const handlePurchase = (variantId: string) => {
    checkout.mutate({
      variantId,
      customData: {
        type: 'token_purchase',
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Out of Tokens</DialogTitle>
          <DialogDescription>
            You&apos;ve run out of generation credits. Purchase more tokens to continue creating amazing emojis!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Token Packages</h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Basic Package</p>
                  <p className="text-sm text-muted-foreground">100 tokens</p>
                </div>
                <Button 
                  onClick={() => handlePurchase(process.env.NEXT_PUBLIC_LEMON_SQUEEZY_BASIC_VARIANT_ID || '')}
                  disabled={checkout.isPending}
                >
                  {checkout.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    '$9.99'
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Pro Package</p>
                  <p className="text-sm text-muted-foreground">500 tokens</p>
                </div>
                <Button 
                  onClick={() => handlePurchase(process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRO_VARIANT_ID || '')}
                  disabled={checkout.isPending}
                >
                  {checkout.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    '$39.99'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 