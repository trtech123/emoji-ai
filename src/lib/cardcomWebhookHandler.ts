import { createClient } from '@/lib/supabase/server'; // Adapt to your Supabase setup (server/service role likely needed)
import { supabaseAdmin } from '@/lib/supabase/admin'; // Keep admin import for potential direct use or comparison

// --- Customize this logic based on what users buy ---
function calculateOutcomeFromCardcomOrder(payload: CardcomPayload): { creditsToAdd?: number; plan?: string } {
  console.log("Cardcom Handler: Calculating outcome for payload:", payload);
  
  let credits = 0; // Default to 0 credits
  const productName = payload.ProdName;
  
  // Determine credits based on the product name received from Cardcom
  if (productName === "10 אימוג\'ים") { // Use escaped quote for the string literal
    credits = 10;
  } else if (productName === "100 אימוג\'ים") {
    credits = 100;
  } else if (productName === "1,000 אימוג\'ים") {
    credits = 1000;
  } else {
    console.warn(`Cardcom Handler: Unrecognized ProdName: ${productName} in payload for deal ${payload.internaldealnumber}. Granting 0 credits.`);
  }

  // We are not handling plans in this logic
  const determinedPlan: string | undefined = undefined; 

  console.log(`Cardcom Handler: Granting ${credits} credits, Plan: ${determinedPlan || 'unchanged'} for deal ${payload.internaldealnumber}`);
  return { creditsToAdd: credits, plan: determinedPlan };
}
// -----------------------------------------------------

// Define the structure of the payload data relevant for processing
// Match this with the actual data Cardcom sends
interface CardcomPayload {
  responsecode?: string;
  description?: string;      // Often used for user-facing description
  ReturnValue?: string;      // Where we stored the user ID
  Custom21?: string;         // Fallback for user ID
  internaldealnumber?: string; // Cardcom's transaction ID
  ProdName?: string;         // Product name if configured in Cardcom
  suminfull?: string;        // Total amount
  cardnumber?: string;       // Last 4 digits
  // Add other relevant fields based on Cardcom docs...
}

export async function processCardcomWebhookEvent(userId: string, payload: CardcomPayload) {
  console.log(`Cardcom Handler: Processing event for user: ${userId}, Deal: ${payload.internaldealnumber}`);

  // Use the admin client for direct updates/RPC calls requiring elevated privileges
  const supabase = supabaseAdmin; 
  // const supabase = await createClient(); // If createClient from /server provides service role, use that instead

  const { creditsToAdd, plan } = calculateOutcomeFromCardcomOrder(payload);

  try {
    // --- 1. Update User Credits (if applicable) ---
    if (creditsToAdd && creditsToAdd > 0) {
      // Using the RPC function defined below
      const { error: rpcError } = await supabase
        .rpc('increment_credits', { 
            p_user_id: userId,             // Ensure param names match RPC func
            p_credits_to_add: creditsToAdd 
        });

      if (rpcError) {
        console.error(`Cardcom Handler: Error calling increment_credits RPC for user ${userId} (Deal: ${payload.internaldealnumber}):`, rpcError);
        throw rpcError; // Stop processing if core action fails
      } else {
        console.log(`Cardcom Handler: Added ${creditsToAdd} credits via RPC to user ${userId}.`);
      }
    }

    // --- 2. Update User Plan/Subscription (if applicable) ---
    if (plan) {
       const { error: profileError } = await supabase
         .from('profiles') // Ensure this table/column exists
         .update({ subscription_tier: plan /*, other fields like expiry? */ })
         .eq('id', userId);

       if (profileError) {
         console.error(`Cardcom Handler: Error updating plan to ${plan} for user ${userId} (Deal: ${payload.internaldealnumber}):`, profileError);
         // Decide how to handle partial success (credits added but plan failed?)
         // Potentially throw error or just log
       } else {
         console.log(`Cardcom Handler: Updated plan to ${plan} for user ${userId}.`);
       }
    }


    // --- 3. Insert Transaction Record (Always recommended) ---
    const description = `Purchase: ${payload.description || 'Cardcom Transaction'} (Deal: ${payload.internaldealnumber})`;
    const { error: insertError } = await supabase
      .from('credit_transactions') // Ensure this table exists
      .insert({
        user_id: userId,
        amount: creditsToAdd || 0, // Log 0 if it was only a plan change
        description: description,
        provider: 'Cardcom',
        provider_transaction_id: payload.internaldealnumber, // Essential for tracking/debugging
        raw_payload: payload // Optional: Store the raw payload for auditing
      });

    if (insertError) {
      console.error(`Cardcom Handler: Error inserting transaction record for user ${userId} (Deal: ${payload.internaldealnumber}):`, insertError);
      // Log this error, but the core action (credits/plan) might have succeeded, so don't necessarily throw
    } else {
      console.log(`Cardcom Handler: Successfully inserted transaction record for user ${userId}.`);
    }

  } catch (error) {
    console.error(`Cardcom Handler: Error processing logic for user ${userId} (Deal: ${payload.internaldealnumber}):`, error);
    // Log to error tracking service (Sentry, etc.)
    // Re-throw the error so the main webhook route logs it, but it still returns 200 OK to Cardcom
    throw error; 
  }
}

// --- Ensure you have the Supabase RPC function (in Supabase SQL Editor) ---
/*
CREATE OR REPLACE FUNCTION public.increment_credits(p_user_id uuid, p_credits_to_add integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Runs with privileges of the function owner
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles -- Ensure schema and table names are correct
  SET generation_credits = generation_credits + p_credits_to_add -- Ensure column name is correct
  WHERE id = p_user_id;
END;
$function$;

-- Grant execute permission to the role your backend uses (e.g., service_role or authenticated)
-- Example: GRANT EXECUTE ON FUNCTION public.increment_credits(uuid, integer) TO service_role;
*/

// --- Ensure DB Tables Exist --- 
/*
-- Example: profiles table needs generation_credits and subscription_tier
-- Ensure column names match the code (e.g., generation_credits, subscription_tier)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS generation_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free'::text;


-- Example: credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  amount integer NOT NULL,
  description text,
  provider text, -- e.g., 'Cardcom', 'LemonSqueezy', 'Manual'
  provider_transaction_id text, -- e.g., Cardcom internaldealnumber
  raw_payload jsonb -- Optional: for auditing
);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY; 
-- Add RLS policies as needed (e.g., users can select their own transactions)

-- Optional: Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_provider_id ON public.credit_transactions(provider, provider_transaction_id); -- Useful for idempotency checks if needed
*/ 