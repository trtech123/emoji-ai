import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentCancelledPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center space-y-6 text-center">
      <XCircle className="h-16 w-16 text-red-500" />
      <h1 className="text-3xl font-bold">Payment Cancelled</h1>
      <p className="text-lg text-muted-foreground">
        Your payment process was cancelled or encountered an issue. You have not been charged.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Return to Home</Link>
      </Button>
      {/* Optional: Add a link back to pricing or the cart */}
      {/* 
      <Button asChild>
        <Link href="/pricing">Try Again</Link>
      </Button>
      */}
    </div>
  );
} 