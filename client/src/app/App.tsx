import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "../features/auth/AuthContext";
import { ConfirmProvider } from "../shared/components/ConfirmProvider";
import { queryClient } from "../shared/api/queryClient";
import { router } from "./router";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConfirmProvider>
          <Toaster
            richColors
            position="bottom-right"
            closeButton
            toastOptions={{
              style: {
                borderRadius: "10px",
                border: "2px solid var(--ink)",
                boxShadow: "4px 4px 0 var(--ink)",
                fontFamily: "var(--sans)",
              },
            }}
          />
          <RouterProvider router={router} />
        </ConfirmProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
