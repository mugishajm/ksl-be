import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "./context/LanguageContext";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import InterpreterPage from "./InterpreterPage";
import Features from "./pages/Features";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Auth from "./pages/Auth";
import UserGuide from "./pages/UserGuide";
import GestureLibrary from "./pages/GestureLibrary";
import ApiDocumentation from "./pages/ApiDocumentation";
import CommunityForum from "./pages/CommunityForum";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import CompleteProfile from "./pages/CompleteProfile";
import { AdminGuard } from "./components/admin/AdminGuard";
import { AdminLayout } from "./components/admin/AdminLayout";
import { ProfileGuard } from "./components/auth/ProfileGuard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageGestures from "./pages/admin/ManageGestures";
import UserManagement from "./pages/admin/UserManagement";
import InterpretationLogs from "./pages/admin/InterpretationLogs";
import Reports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProfileGuard><Index /></ProfileGuard>} />
              <Route
                path="/translate"
                element={
                  <ProfileGuard>
                    <InterpreterPage />
                  </ProfileGuard>
                }
              />
              <Route path="/features" element={<ProfileGuard><Features /></ProfileGuard>} />
              <Route path="/about" element={<ProfileGuard><About /></ProfileGuard>} />
              <Route path="/how-it-works" element={<ProfileGuard><HowItWorks /></ProfileGuard>} />
              <Route path="/user-guide" element={<ProfileGuard><UserGuide /></ProfileGuard>} />
              <Route path="/gesture-library" element={<ProfileGuard><GestureLibrary /></ProfileGuard>} />
              <Route path="/api-docs" element={<ProfileGuard><ApiDocumentation /></ProfileGuard>} />
              <Route path="/community-forum" element={<ProfileGuard><CommunityForum /></ProfileGuard>} />
              <Route path="/profile" element={<ProfileGuard><Profile /></ProfileGuard>} />
              <Route path="/settings" element={<ProfileGuard><Settings /></ProfileGuard>} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route
                path="/admin"
                element={
                  <AdminGuard>
                    <AdminLayout />
                  </AdminGuard>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="gestures" element={<ManageGestures />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="logs" element={<InterpretationLogs />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
