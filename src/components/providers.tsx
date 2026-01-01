"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { Toaster } from "sonner";
import { trpc } from "@/lib/trpc";
import { ThemeProvider } from "@/components/theme";
import { CommandPalette } from "@/components/command";
import { useUIStore } from "@/stores/ui.store";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

function CommandPaletteWrapper() {
  const { commandPaletteOpen, toggleCommandPalette } = useUIStore();
  return (
    <CommandPalette
      open={commandPaletteOpen}
      onOpenChange={(open) => {
        if (!open) toggleCommandPalette();
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {children}
          <CommandPaletteWrapper />
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              className: "rounded-lg",
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
