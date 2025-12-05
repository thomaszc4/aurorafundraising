import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Fundraising from "./pages/Fundraising";
import Resources from "./pages/Resources";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminCampaigns from "./pages/admin/Campaigns";
import AdminOrders from "./pages/admin/Orders";
import AdminParticipants from "./pages/admin/Participants";
import CampaignSettings from "./pages/admin/CampaignSettings";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import StudentDashboard from "./pages/student/Dashboard";
import PublicStudentPage from "./pages/student/PublicPage";
import ProductDetail from "./pages/fundraise/ProductDetail";
import CheckoutSuccess from "./pages/checkout/Success";
import CheckoutCancel from "./pages/checkout/Cancel";
import PublicSurvey from "./pages/survey/PublicSurvey";
import DonorPreferences from "./pages/preferences/DonorPreferences";
import Unsubscribe from "./pages/unsubscribe/Unsubscribe";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/fundraising" element={<Fundraising />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Public survey page */}
            <Route path="/survey/:campaignId" element={<PublicSurvey />} />
            
            {/* Donor preference center */}
            <Route path="/preferences/:donorId" element={<DonorPreferences />} />
            
            {/* Unsubscribe page */}
            <Route path="/unsubscribe/:donorId" element={<Unsubscribe />} />
            
            {/* Public student fundraising pages */}
            <Route path="/student/:slug" element={<PublicStudentPage />} />
            <Route path="/fundraise/:slug" element={<PublicStudentPage />} />
            <Route path="/fundraise/:slug/product/:productId" element={<ProductDetail />} />
            <Route path="/product/:productId" element={<ProductDetail />} />
            
            {/* Checkout pages */}
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />
            
            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/super"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/campaigns"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminCampaigns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/participants"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminParticipants />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requireAdmin>
                  <CampaignSettings />
                </ProtectedRoute>
              }
            />
            
            {/* Protected Student Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireStudent>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
