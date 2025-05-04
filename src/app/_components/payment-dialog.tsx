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
import { toast } from "react-hot-toast";

// --- Get this from environment variables --- MUST BE SET
const CARDCOM_BASE_URL = process.env.NEXT_PUBLIC_CARDCOM_PAYMENT_URL;
// -------------------------------------------

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

export function PaymentDialog({ open, onOpenChange, userId }: PaymentDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCardcomPurchase = async () => {
    setIsLoading(true);
    toast("Redirecting to payment page...");

    if (!userId) {
      toast.error("User not identified. Please ensure you are logged in.");
      setIsLoading(false);
      return;
    }

    if (!CARDCOM_BASE_URL) {
        console.error("NEXT_PUBLIC_CARDCOM_PAYMENT_URL is not configured!");
        toast.error("Payment system is not configured. Please contact support.");
        setIsLoading(false);
        return;
    }

    try {
      // --- Construct the final URL --- 
      // Following the example: ReturnData and Custom21 both get the user ID
      const finalCardcomUrl = `${CARDCOM_BASE_URL}?ReturnData=${encodeURIComponent(userId)}&Custom21=${encodeURIComponent(userId)}`;
      
      console.log(`Redirecting user ${userId} to Cardcom: ${finalCardcomUrl}`);

      // --- Redirect the user --- 
      window.location.href = finalCardcomUrl;
      // No need to setIsLoading(false) as the page navigates away

    } catch (error) {
      console.error("Error initiating Cardcom redirect:", error);
      toast.error("Failed to initiate payment. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isLoading && !isOpen) return; // Prevent closing while loading/redirecting
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>נגמרו לך קרדיטי היצירה</DialogTitle>
          <DialogDescription>
            רכוש עוד קרדיטים כדי להמשיך ליצור אימוג&apos;ים מדהימים!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
           {/* Simplified content - Single button */} 
           <p className="text-center text-muted-foreground">לחץ על הכפתור כדי לעבור לדף תשלום מאובטח.</p>
           <Button
            onClick={handleCardcomPurchase}
            disabled={isLoading || !userId} // Disable if loading or no user ID
            className="w-full max-w-xs"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                מעבר לתשלום...
              </>
            ) : (
              "רכוש קרדיטים"
            )}
          </Button>
           { !userId && <p className="text-sm text-red-500">Please log in to purchase credits.</p> }
        </div>
      </DialogContent>
    </Dialog>
  );
} 