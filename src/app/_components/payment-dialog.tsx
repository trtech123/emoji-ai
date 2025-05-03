import * as React from "react";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductOption {
  name: string;
  description: string;
  price: string;
  variantId: number;
}

// Hebrew price formatting and text
const productOptions: ProductOption[] = [
  { name: "10 אימוג׳ים", description: "קבל 10 קרדיטי יצירה", price: "₪9.90", variantId: 780193 },
  { name: "100 אימוג׳ים", description: "קבל 100 קרדיטי יצירה", price: "₪28.90", variantId: 780206 },
  { name: "1,000 אימוג׳ים", description: "קבל 1,000 קרדיטי יצירה", price: "₪199.99", variantId: 780214 },
];

export function PaymentDialog({ open, onOpenChange }: PaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState<number | null>(null);

  const handlePurchase = async (variantId: number) => {
    setIsSubmitting(variantId);
    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variantId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsSubmitting(null);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setIsSubmitting(null);
      }
    } catch (error) {
      setIsSubmitting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>נגמרו לך קרדיטי היצירה</DialogTitle>
          <DialogDescription>
             נגמרו לך קרדיטי היצירה. רכוש עוד קרדיטים כדי להמשיך ליצור אימוג&#39;ים מדהימים!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {productOptions.map((option) => (
            <div key={option.variantId} className="flex items-center justify-between p-4 border rounded-lg gap-4">
              <div className="flex-grow">
                <p className="font-medium">{option.name}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              <Button
                onClick={() => handlePurchase(option.variantId)}
                disabled={isSubmitting !== null}
                className="min-w-[120px]"
              >
                {isSubmitting === option.variantId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    מעבד...
                  </>
                ) : (
                  option.price
                )}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 