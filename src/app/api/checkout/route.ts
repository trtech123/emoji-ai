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
    console.log('Received checkout request:', body);
    
    const { variantId, customData } = checkoutSchema.parse(body);
    console.log('Parsed checkout data:', { variantId, customData });

    // Validate that variantId is a valid number string
    if (!/^\d+$/.test(variantId)) {
      console.error('Invalid variant ID format:', variantId);
      return NextResponse.json(
        { error: 'Invalid variant ID format', message: 'Variant ID must be a numeric string' },
        { status: 400 }
      );
    }

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