// import { SearchBar } from "@/app/_components/search-bar";
// import { getEmojis } from "@/server/get-emojis"; // Import the data fetching function
// import Link from "next/link";
// import Image from "next/image";

// Import the new client component
import { EmojiSearchResults } from "./emoji-search-results";

// This page component no longer needs searchParams directly
// or to be async, as the client component handles it.
export default function SearchPage() {
  // Remove server-side data fetching logic
  /*
  let emojis = [];
  try {
    // ... getEmojis call ...
  } catch (error) {
    // ... error handling ...
  }
  */

  return (
    <div className="flex flex-col w-full gap-8 py-4">
      {/* Render the client component which handles fetching and display */}
      <EmojiSearchResults />

      {/* === REMOVE server-side grid rendering logic === */}
      {/* 
      {searchQuery && ( ... )}
      {emojis && emojis.length > 0 ? (
         // ... grid mapping ...
      ) : (
         // ... no results message ...
      )}
       */}
    </div>
  );
} 