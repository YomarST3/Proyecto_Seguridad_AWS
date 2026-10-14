import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './modules/auth/LoginPage';
import { RegisterPage } from './modules/auth/RegisterPage';
import { EmailVerificationPendingPage } from './modules/auth/EmailVerificationPendingPage';
import { AccessRequestPendingPage } from './modules/auth/AccessRequestPendingPage';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { CustomersPage } from './modules/customers/CustomersPage';
import { ProductsPage } from './modules/products/ProductsPage';
import { InventoryPage } from './modules/inventory/InventoryPage';
import { OrdersPage } from './modules/orders/OrdersPage';
import { SalesPage } from './modules/sales/SalesPage';
import { PaymentsPage } from './modules/payments/PaymentsPage';
import { EmployeesPage } from './modules/employees/EmployeesPage';
import { AnalyticsPage } from './modules/analytics/AnalyticsPage';
import { ProbabilityPage } from './modules/probability/ProbabilityPage';
import { InsightsPage } from './modules/insights/InsightsPage';
import { ReportsPage } from './modules/reports/ReportsPage';
import { SettingsPage } from './modules/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Simple Auth Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('salesia_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/verificar-correo-pendiente" element={<EmailVerificationPendingPage />} />
          <Route path="/pendiente-aprobacion" element={<AccessRequestPendingPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >

            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="probability" element={<ProbabilityPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
