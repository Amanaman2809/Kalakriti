"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import debounce from "lodash.debounce";

type Suggestion = {
  id: string;
  name: string;
};

export function useSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Debounced fetchSuggestions
  const fetchSuggestions = useMemo(() => {
    return debounce(async (query: string) => {
      if (query.trim().length < 2 || !apiBase) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        const res = await fetch(`${apiBase}/api/search/autocomplete?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("API error");

        const data: Suggestion[] = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Autocomplete error:", err);
        setHasError(true);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [apiBase]);

  // Trigger fetchSuggestions only when searchQuery changes and suggestions are visible
  useEffect(() => {
    if (showSuggestions && searchQuery.trim().length >= 2) {
      fetchSuggestions(searchQuery);
    } else {
      setSuggestions([]);
    }

    return () => {
      fetchSuggestions.cancel(); // cleanup on unmount
    };
  }, [searchQuery, showSuggestions, fetchSuggestions]);

  // Submit search
  const handleSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    router.push(`/products?q=${encodeURIComponent(trimmed)}`);
    setShowSuggestions(false);
  };

  // Suggestion selection
  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSearchQuery(suggestion.name);
    handleSearch(suggestion.name);
  };

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    handleSearch,
    handleSuggestionClick,
    isLoading,
    hasError,
  };
}
