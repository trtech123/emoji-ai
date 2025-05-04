// Example using Next.js App Router (/app/api/cardcom-webhook/route.ts)
import { NextRequest, NextResponse } from 'next/server';
import { processCardcomWebhookEvent } from '@/lib/cardcomWebhookHandler'; 
import { verifyCardcomIp } from '@/lib/cardcomIpVerifier'; 

export async function POST(request: NextRequest) {
  console.log('\n--- Cardcom Webhook Request Start ---');
  
  // Log headers for debugging IP/proxy issues
  console.log('Cardcom Webhook: Incoming Headers:', Object.fromEntries(request.headers.entries()));

  // 1. Verify IP Address (CRUCIAL for security)
  const isIpAllowed = verifyCardcomIp(request);
  console.log(`Cardcom Webhook: IP Verification Result: ${isIpAllowed}`);
  if (!isIpAllowed) { // Use the stored result
    console.warn('Cardcom Webhook: Denied request from invalid IP.');
    return NextResponse.json({ error: 'IP address not allowed' }, { status: 403 });
  }

  let payload: Record<string, string> = {};
  let internalDealNumber: string | undefined = undefined;
  let userId: string | undefined = undefined;
  let responseCode: string | undefined = undefined;

  try {
    // 2. Parse Request Body (Cardcom sends URL-encoded form data)
    const formData = await request.formData();
    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        payload[key] = value;
      } else {
        console.warn(`Cardcom Webhook: Received non-string value for key ${key}`);
      }
    });

    console.log('Cardcom Webhook: Received Parsed Payload:', payload); 

    // 3. Extract Key Data
    responseCode = payload.responsecode;
    userId = payload.ReturnData || payload.Custom21; // Prioritize ReturnData
    internalDealNumber = payload.internaldealnumber; 

    // 4. Check for Success (Cardcom specific: '0' usually means success)
    if (responseCode === '0') {
      console.log(`Cardcom Webhook: Successful transaction identified. Deal: ${internalDealNumber || '(no deal number)'}, User: ${userId || 'ID_MISSING'}`);

      if (!userId) {
         console.error('Cardcom Webhook Error: Missing userId (checked ReturnData and Custom21) in successful webhook payload.', payload);
         return NextResponse.json({ success: true, message: 'Processed, but user ID missing' }, { status: 200 });
      }

      // 5. Process Successful Event (Offload logic to separate handler)
      console.log(`Cardcom Webhook: Calling processCardcomWebhookEvent for user ${userId}...`);
      await processCardcomWebhookEvent(userId, payload); 
      console.log(`Cardcom Webhook: Finished processCardcomWebhookEvent for user ${userId}.`);

    } else {
      console.warn(`Cardcom Webhook: Received non-successful transaction. Code: ${responseCode}, Deal: ${internalDealNumber || '(no deal number)'}`, payload);
    }

    // 6. Acknowledge Receipt (ALWAYS return 200 OK to Cardcom if possible)
    console.log('Cardcom Webhook: Sending 200 OK response.');
    console.log('--- Cardcom Webhook Request End ---\n');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Cardcom Webhook: Unhandled processing error:', { 
        errorMessage: error instanceof Error ? error.message : String(error), 
        dealNumber: internalDealNumber, 
        userId: userId, 
        responseCode: responseCode, 
        payload: payload, // Log payload in case of error
        errorObject: error // Log the full error object if helpful
    });
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    // Return 200 even on internal errors to prevent Cardcom retries, but log the failure
    console.log('Cardcom Webhook: Sending 200 OK response despite internal error.');
    console.log('--- Cardcom Webhook Request End (with error) ---\n');
    return NextResponse.json({ success: true, error: `Webhook processing failed internally: ${message}` }, { status: 200 });
  }
} 