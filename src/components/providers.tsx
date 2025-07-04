"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { CaptchaProvider } from "./CaptchaProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // These defaults support our resilience mission
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime)
            retry: (failureCount) => {
              // Custom retry logic for different error types
              if (failureCount < 3) return true;
              return false;
            },
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CaptchaProvider>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </CaptchaProvider>
    </QueryClientProvider>
  );
}
