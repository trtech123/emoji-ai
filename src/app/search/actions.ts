"use server";

import { getEmojis } from "@/server/get-emojis";
import { z } from "zod";

// Define the expected structure of an emoji for type safety
// Match this with the actual columns returned by getEmojis
const EmojiSchema = z.object({
    id: z.string(),
    prompt: z.string().nullable(),
    original_url: z.string().nullable(),
    no_background_url: z.string().nullable(),
    // Add other fields if needed by the client component
});

const SearchParamsSchema = z.object({
    searchQuery: z.string().optional(),
    limit: z.number().optional().default(50), // Default limit for dynamic search
    // Add offset or other params if needed later
});

export async function searchEmojisAction(params: z.infer<typeof SearchParamsSchema>): Promise<{
    success: boolean;
    emojis?: z.infer<typeof EmojiSchema>[];
    error?: string;
}> {
    const validatedParams = SearchParamsSchema.safeParse(params);

    if (!validatedParams.success) {
        return { success: false, error: "Invalid search parameters." };
    }

    const { searchQuery, limit } = validatedParams.data;

    try {
        const fetchedEmojis = await getEmojis({
            limit: limit,
            status: 'generated',
            orderBy: { column: 'created_at', ascending: false },
            searchQuery: searchQuery // Pass validated search query
        });
        
        // Validate the structure of returned emojis (optional but good practice)
        const validatedEmojis = z.array(EmojiSchema).safeParse(fetchedEmojis);
        if (!validatedEmojis.success) {
            console.error("Fetched emoji data validation failed:", validatedEmojis.error);
            // Decide how to handle validation errors - return partial data or error?
            return { success: false, error: "Invalid data format received from database." };
        }

        return { success: true, emojis: validatedEmojis.data };

    } catch (error: any) {
        console.error("Server action error fetching emojis:", error);
        return { success: false, error: error.message || "Failed to fetch emojis." };
    }
} 