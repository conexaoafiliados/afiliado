import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import App from "./App";
import { trpc } from "./lib/trpc";
import { getAccessToken } from "./lib/supabase";
import { AuthProvider } from "./_core/auth/AuthProvider";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const code = (error as { data?: { code?: string } })?.data?.code;
        if (code === "UNAUTHORIZED" || code === "FORBIDDEN") return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async headers() {
        const token = await getAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>
);
