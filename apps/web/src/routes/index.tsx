import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';

// Pages
import { LandingPage } from '../pages/LandingPage';
import { ExplorePage } from '../pages/ExplorePage';
import { TailorProfilePage } from '../pages/TailorProfilePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

// Customer Pages
import { CreateRequestPage } from '../pages/CreateRequestPage';
import { CustomerRequestsPage } from '../pages/CustomerRequestsPage';
import { RequestDetailPage } from '../pages/RequestDetailPage';
import { CustomerOrdersPage } from '../pages/CustomerOrdersPage';
import { OrderDetailPage } from '../pages/OrderDetailPage';
import { AppointmentsPage } from '../pages/AppointmentsPage';
import { CustomerProfilePage } from '../pages/CustomerProfilePage';

// Tailor Pages
import { TailorDashboardPage } from '../pages/TailorDashboardPage';
import { TailorRequestsInboxPage } from '../pages/TailorRequestsInboxPage';
import { TailorOrdersPage } from '../pages/TailorOrdersPage';
import { TailorSchedulePage } from '../pages/TailorSchedulePage';
import { TailorProfileSettingsPage } from '../pages/TailorProfileSettingsPage';

// Admin Page
import { AdminDashboardPage } from '../pages/AdminDashboardPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/tailors/:slug" element={<TailorProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer Portal */}
        <Route path="/app/requests/new" element={<CreateRequestPage />} />
        <Route path="/app/requests" element={<CustomerRequestsPage />} />
        <Route path="/app/requests/:id" element={<RequestDetailPage />} />
        <Route path="/app/orders" element={<CustomerOrdersPage />} />
        <Route path="/app/orders/:id" element={<OrderDetailPage />} />
        <Route path="/app/appointments" element={<AppointmentsPage />} />
        <Route path="/app/profile" element={<CustomerProfilePage />} />

        {/* Tailor Studio Portal */}
        <Route path="/tailor/dashboard" element={<TailorDashboardPage />} />
        <Route path="/tailor/requests" element={<TailorRequestsInboxPage />} />
        <Route path="/tailor/orders" element={<TailorOrdersPage />} />
        <Route path="/tailor/schedule" element={<TailorSchedulePage />} />
        <Route path="/tailor/profile" element={<TailorProfileSettingsPage />} />

        {/* Admin Console */}
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/businesses" element={<AdminDashboardPage />} />
        <Route path="/admin/orders" element={<AdminDashboardPage />} />
        <Route path="/admin/reviews" element={<AdminDashboardPage />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
