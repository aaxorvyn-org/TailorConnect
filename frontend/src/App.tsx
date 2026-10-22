import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { I18nProvider } from './i18n';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicLayout, DashboardLayout } from './layouts';

// Public Pages
import {
  HomePage,
  FindTailorsPage,
  TailorRegistrationPage,
  LoginPage,
  RegisterPage,
  AboutPage,
  ServicesPage,
  ContactPage,
} from './pages/public';

// Customer Dashboard Pages
import {
  CustomerDashboardPage,
  CustomerNearbyTailorsPage,
  CustomerOrdersPage,
  CustomerProfilePage,
  CustomerMeasurementsPage,
} from './pages/dashboard/customer';


// Tailor Dashboard Pages
import {
  TailorDashboardPage,
  TailorShopProfilePage,
  TailorCustomersPage,
  TailorDesignsPage,
  TailorOrdersPage,
  TailorSettingsPage,
} from './pages/dashboard/tailor';

// Admin Dashboard Page
import { AdminDashboardPage } from './pages/dashboard/admin';

export function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Pages Shell */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/tailors" element={<FindTailorsPage />} />
                <Route path="/register-tailor" element={<TailorRegistrationPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Route>

              {/* Customer Dashboard Shell - Protected: CUSTOMER role only */}
              <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
                <Route path="/dashboard/customer" element={<DashboardLayout role="customer" />}>
                  <Route index element={<CustomerDashboardPage />} />
                  <Route path="nearby" element={<CustomerNearbyTailorsPage />} />
                  <Route path="measurements" element={<CustomerMeasurementsPage />} />
                  <Route path="orders" element={<CustomerOrdersPage />} />
                  <Route path="profile" element={<CustomerProfilePage />} />
                </Route>
              </Route>


              {/* Tailor Dashboard Shell - Protected: TAILOR role only */}
              <Route element={<ProtectedRoute allowedRoles={['TAILOR']} />}>
                <Route path="/dashboard/tailor" element={<DashboardLayout role="tailor" />}>
                  <Route index element={<TailorDashboardPage />} />
                  <Route path="profile" element={<TailorShopProfilePage />} />
                  <Route path="customers" element={<TailorCustomersPage />} />
                  <Route path="designs" element={<TailorDesignsPage />} />
                  <Route path="orders" element={<TailorOrdersPage />} />
                  <Route path="settings" element={<TailorSettingsPage />} />
                </Route>
              </Route>

              {/* Admin Dashboard Shell - Protected: ADMIN role only */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/dashboard/admin" element={<DashboardLayout role="admin" />}>
                  <Route index element={<AdminDashboardPage />} />
                </Route>
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </I18nProvider>
  );
}

export default App;
