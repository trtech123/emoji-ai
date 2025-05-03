import { NextResponse } from 'next/server';
import { createCheckout } from '@/lib/lemonsqueezy';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Define a schema for the expected request body
const CreateCheckoutSchema = z.object({
  variantId: z.number().int().positive(), // Expect a positive integer variantId
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let requestData;
  try {
    const body = await request.json();
    requestData = CreateCheckoutSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body.', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to parse request body.' }, { status: 400 });
  }

  const { variantId } = requestData; // Use the validated variantId from the request

  // const variantId = process.env.LEMONSQUEEZY_CREDIT_VARIANT_ID; // Keep this commented out or remove

  // if (!variantId) { // This check is now handled by Zod schema validation
  //   console.error('LEMONSQUEEZY_CREDIT_VARIANT_ID is not set in environment variables.');
  //   return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  // }

  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) {
    console.error('LEMONSQUEEZY_STORE_ID is not set in environment variables.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // Ensure storeId is parsed correctly
    const numericStoreId = parseInt(storeId, 10);
    if (isNaN(numericStoreId)) {
       console.error('Invalid LEMONSQUEEZY_STORE_ID:', storeId);
       return NextResponse.json({ error: 'Server configuration error (Invalid Store ID).' }, { status: 500 });
    }
    
    const checkout = await createCheckout(numericStoreId, variantId, {
      checkoutOptions: { dark: true },
      checkoutData: {
        email: user.email,
        custom: { user_id: user.id },
      },
    });

    const checkoutUrl = checkout.data?.data.attributes.url;

    if (!checkoutUrl) {
      console.error('Failed to create Lemon Squeezy checkout:', checkout.error || 'No checkout URL returned');
      throw new Error('Could not create checkout session.');
    }

    return NextResponse.json({ checkoutUrl });

  } catch (error) {
    console.error('Error creating Lemon Squeezy checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to create checkout link.', details: errorMessage }, { status: 500 });
  }
} 