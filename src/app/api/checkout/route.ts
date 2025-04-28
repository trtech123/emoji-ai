import { NextResponse } from 'next/server';
import { createCheckout } from '@/lib/checkout';
import { z } from 'zod';

const checkoutSchema = z.object({
  variantId: z.number(),
  customData: z.record(z.any()).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = checkoutSchema.parse(body);

    const checkout = await createCheckout(validatedData);

    return NextResponse.json(checkout);
  } catch (error) {
    console.error('Checkout error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
} 