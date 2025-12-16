import { Toaster } from "@/components/ui/toaster";
import React, { Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { AuthProvider } from "./contexts/AuthContext";
// import { ProtectedRoute } from "./components/ProtectedRoute"; // Temporarily disabled if causing issues
import NotFound from "./pages/NotFound";

// Lazy Load Pages to prevent bundle crash on startup
const Index = React.lazy(() => import("./pages/Index"));
const Auth = React.lazy(() => import("./pages/Auth"));
const AuroraGame = React.lazy(() => import("./components/game/AuroraGame").then(module => ({ default: module.AuroraGame })));

const queryClient = new QueryClient();

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-900 text-white min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="bg-black p-4 rounded overflow-auto">
            {this.state.error?.toString()}
          </pre>
          <button
            className="mt-4 px-4 py-2 bg-white text-black rounded"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Home Page */}
                <Route path="/" element={<Index />} />

                {/* Auth */}
                <Route path="/auth" element={<Auth />} />

                {/* Game Route for verification */}
                <Route path="/test-game" element={<AuroraGame playerId="local-tester" campaignId="test-campaign" displayName="Tester" />} />

                {/* Maintenance / Direct Access */}
                <Route path="/maintenance" element={
                  <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
                    <h1 className="text-4xl font-bold mb-4 text-teal-400">Aurora Fundraising</h1>
                    <div className="flex gap-4">
                      <Link to="/" className="px-6 py-2 bg-blue-600 rounded">Home</Link>
                      <Link to="/test-game" className="px-6 py-2 bg-green-600 rounded">Play Game</Link>
                    </div>
                  </div>
                } />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
