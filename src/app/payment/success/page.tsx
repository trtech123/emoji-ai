import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center space-y-6 text-center">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <h1 className="text-3xl font-bold">Payment Successful!</h1>
      <p className="text-lg text-muted-foreground">
        Thank you for your purchase. Your credits have been added to your account.
      </p>
      <Button asChild>
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  );
} 