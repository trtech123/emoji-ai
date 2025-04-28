import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckout } from '@/lib/lemon-squeezy';

const checkoutSchema = z.object({
  variantId: z.number(),
  customData: z.record(z.any()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { variantId, customData } = checkoutSchema.parse(body);

    const checkoutUrl = await createCheckout({ variantId, customData });
    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
} 