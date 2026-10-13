"use client";

import { useState } from "react";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";

const NO_RETRY = [401, 403, 404];

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          // One place for "session expired": any 401 sends the user to the login screen.
          onError: (error) => {
            if (error instanceof ApiError && error.status === 401 && !window.location.pathname.startsWith("/login")) {
              // hard navigation on purpose: it also throws away every in-memory cache from the expired session
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.href = "/login";
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, error) => !(error instanceof ApiError && NO_RETRY.includes(error.status)) && count < 1,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
