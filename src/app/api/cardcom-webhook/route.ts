// Example using Next.js App Router (/app/api/cardcom-webhook/route.ts)
import { NextRequest, NextResponse } from 'next/server';
import { processCardcomWebhookEvent } from '@/lib/cardcomWebhookHandler'; 
import { verifyCardcomIp } from '@/lib/cardcomIpVerifier'; 

export async function POST(request: NextRequest) {
  // 1. Verify IP Address (CRUCIAL for security)
  if (!verifyCardcomIp(request)) {
    console.warn('Cardcom Webhook: Denied request from invalid IP.');
    return NextResponse.json({ error: 'IP address not allowed' }, { status: 403 });
  }

  try {
    // 2. Parse Request Body (Cardcom sends URL-encoded form data)
    const formData = await request.formData();
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        payload[key] = value;
      } else {
         // Handle potential non-string values if necessary, otherwise ignore/log
        console.warn(`Cardcom Webhook: Received non-string value for key ${key}`);
      }
    });

    console.log('Cardcom Webhook: Received Payload:', payload); // Log for debugging

    // 3. Extract Key Data
    const responseCode = payload.responsecode;
    // Prioritize ReturnData, fallback to Custom21 for user ID (as per your PaymentDialog setup)
    let userId = payload.ReturnData || payload.Custom21;
    const internalDealNumber = payload.internaldealnumber; // Example: Use for logging/tracking

    // 4. Check for Success (Cardcom specific: '0' usually means success)
    if (responseCode === '0') {
      console.log(`Cardcom Webhook: Successful transaction ${internalDealNumber || '(no deal number)'} for user: ${userId || 'ID_MISSING'}`);

      if (!userId) {
         // This is problematic - successful payment but no user to assign it to.
         console.error('Cardcom Webhook Error: Missing userId (checked ReturnData and Custom21) in successful webhook payload.', payload);
         // Still return 200 OK to Cardcom, but log this serious issue.
         return NextResponse.json({ success: true, message: 'Processed, but user ID missing' }, { status: 200 });
      }

      // 5. Process Successful Event (Offload logic to separate handler)
      await processCardcomWebhookEvent(userId, payload); // Pass full payload if handler needs more data

    } else {
      // Log failed or other status transactions
      console.warn(`Cardcom Webhook: Received non-successful transaction. Code: ${responseCode}, Deal: ${internalDealNumber || '(no deal number)'}`, payload);
      // Handle failed transaction logging/notifications if needed
    }

    // 6. Acknowledge Receipt (ALWAYS return 200 OK to Cardcom if possible)
    // This prevents Cardcom from resending the webhook due to processing errors on your side.
    console.log('Cardcom Webhook: Sending 200 OK response.');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Cardcom Webhook: Unhandled processing error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    // Return 200 even on internal errors to prevent Cardcom retries, but log the failure
    return NextResponse.json({ success: true, error: `Webhook processing failed internally: ${message}` }, { status: 200 });
  }
} 