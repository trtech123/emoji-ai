"use client"; // Needs to be client for input state later

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Simple debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}

interface SearchBarProps {
  // Add props for search handling later, e.g., onSearch, initialValue
  className?: string; // Allow passing custom classes
}

export function SearchBar({ className }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Initialize state from URL search param if present
  const initialQuery = searchParams.get('q') || "";
  const [searchValue, setSearchValue] = useState(initialQuery);

  // Function to update URL query parameter
  const updateQueryParam = (query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    // Use replace instead of push if we are already on the search page
    // to avoid polluting browser history for every keystroke
    if (pathname === '/search') {
      router.replace(`/search?${params.toString()}`);
    } else {
      // If anywhere else, navigate to search page
      router.push(`/search?${params.toString()}`);
    }
  };

  // Debounced version of the update function
  const debouncedUpdateQueryParam = useCallback(debounce(updateQueryParam, 300), [searchParams, router, pathname]);

  // Handle input change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchValue(newValue);
    debouncedUpdateQueryParam(newValue.trim());
  };

  // Handle direct form submission (e.g., pressing Enter)
  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Trigger immediate update/navigation on submit, bypassing debounce
    updateQueryParam(searchValue.trim()); 
  };

  // Sync state if URL changes externally (e.g., browser back/forward)
  useEffect(() => {
    setSearchValue(searchParams.get('q') || "");
  }, [searchParams]);

  return (
    // Use a form element for submission handling
    <form onSubmit={handleSearchSubmit} className={`relative w-full ${className || ''}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="חפש והורד מעל 6,555,285 אימוג'י AI" // Translated placeholder
        className="w-full rounded-full bg-muted pl-9 pr-4 py-2 text-sm" // Adjust padding for icon
        value={searchValue} // Controlled input
        onChange={handleChange} // Update state on change
      />
      {/* Optionally add a hidden submit button or rely on Enter key press */}
      <button type="submit" hidden />
    </form>
  );
} 