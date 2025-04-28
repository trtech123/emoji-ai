import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckout } from '@/lib/lemon-squeezy';

const checkoutSchema = z.object({
  variantId: z.string(),
  customData: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { variantId, customData } = checkoutSchema.parse(body);

    console.log('Creating checkout with:', { variantId, customData });

    const checkoutUrl = await createCheckout({
      variantId,
      customData,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to create checkout',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 