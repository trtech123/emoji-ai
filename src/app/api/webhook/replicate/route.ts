import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { z } from "zod";

// Schema for the incoming Replicate webhook payload (adjust based on actual rembg output)
const replicateWebhookSchema = z.object({
  status: z.enum(["starting", "processing", "succeeded", "failed", "canceled"]),
  output: z.string().url().optional().nullable(), // URL of the output image
  error: z.string().optional().nullable(),
  // Add other fields if needed, e.g., input, logs
});

export async function POST(request: Request) {
  console.log("Replicate webhook received");

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const secret = searchParams.get("secret");

  // 1. Verify Secret
  if (!process.env.WEBHOOK_SECRET) {
    console.error("WEBHOOK_SECRET is not set. Cannot verify webhook.");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
  if (secret !== process.env.WEBHOOK_SECRET) {
    console.error("Invalid webhook secret received.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Verify ID
  if (!id) {
    console.error("Missing 'id' query parameter in webhook URL.");
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  try {
    const payload = await request.json();
    console.log("Webhook payload for id:", id, payload);

    // 3. Parse Payload
    const parsedPayload = replicateWebhookSchema.safeParse(payload);

    if (!parsedPayload.success) {
      console.error("Failed to parse Replicate webhook payload:", parsedPayload.error);
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    const { status, output, error } = parsedPayload.data;

    // 4. Update Supabase
    const supabaseAdmin = createAdminClient();
    // Define the type explicitly for clarity
    let updateData: { 
      status: string; 
      no_background_url?: string | null; 
      error?: string | null 
    } = { status }; 

    if (status === "succeeded" && output) {
      console.log(`Background removal succeeded for ${id}. Output URL: ${output}`);
      updateData.no_background_url = output;
      updateData.error = null; // Clear previous errors if succeeded
    } else if (status === "failed") {
      console.error(`Background removal failed for ${id}. Error: ${error}`);
      updateData.error = `Background removal failed: ${error || 'Unknown error'}`;
      updateData.no_background_url = null; // Ensure no_background_url is cleared on failure
    } else {
      console.log(`Received non-final status update for ${id}: ${status}`);
      // Only update status for intermediate states
    }

    const { error: dbError } = await supabaseAdmin
      .from('emoji')
      .update(updateData)
      .eq('id', id);

    if (dbError) {
      console.error(`Failed to update Supabase for ${id}:`, dbError);
      // Don't return 500 to Replicate, as it might retry. Log it instead.
    } else {
      console.log(`Successfully updated Supabase for ${id} with status ${status}.`);
    }

    // Respond to Replicate
    return NextResponse.json({ message: "Webhook received successfully" });

  } catch (err) {
    console.error("Error processing Replicate webhook:", err);
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    // Attempt to update the status to failed in the DB even if webhook processing fails
    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin
        .from('emoji')
        .update({ status: 'failed', error: `Webhook processing error: ${errorMsg}` })
        .eq('id', id);
    } catch (dbUpdateError) {
      console.error(`Failed to update DB status after webhook processing error for ${id}:`, dbUpdateError);
    }
    return NextResponse.json({ error: "Failed to process webhook", details: errorMsg }, { status: 500 });
  }
} 