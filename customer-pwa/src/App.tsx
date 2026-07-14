import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/QueryProvider";
import { ErrorBoundary } from "@/routes/ErrorBoundary";
import { AppRouter } from "@/routes/AppRouter";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { InstallAppPrompt } from "@/components/layout/InstallAppPrompt";
import { UpdateAvailablePrompt } from "@/components/layout/UpdateAvailablePrompt";

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <BrowserRouter>
          <OfflineBanner />
          <AppRouter />
          <InstallAppPrompt />
          <UpdateAvailablePrompt />
          <Toaster position="top-center" richColors closeButton />
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
