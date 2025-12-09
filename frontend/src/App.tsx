import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Dashboard Pages
import { DashboardHomePage } from './pages/dashboard/DashboardHomePage';
import Professionals from './pages/Professionals';
import Rooms from './pages/Rooms';
import { ServicesPage } from './pages/dashboard/ServicesPage';
import { AvailabilityPage } from './pages/dashboard/AvailabilityPage';
import { AppointmentsPage } from './pages/dashboard/AppointmentsPage';
import Financial from './pages/Financial';

// Public Pages
import { HomePage } from './pages/HomePage';
import { BookingPage } from './pages/public/BookingPage';
import { BookingConfirmationPage } from './pages/public/BookingConfirmationPage';
import BookingManagement from './pages/public/BookingManagement';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/book/:slug" element={<BookingPage />} />
        <Route path="/booking-confirmed/:id" element={<BookingConfirmationPage />} />
        <Route path="/manage/:token" element={<BookingManagement />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/professionals"
          element={
            <ProtectedRoute>
              <Professionals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/rooms"
          element={
            <ProtectedRoute>
              <Rooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/services"
          element={
            <ProtectedRoute>
              <ServicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/availability"
          element={
            <ProtectedRoute>
              <AvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/appointments"
          element={
            <ProtectedRoute>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/financial"
          element={
            <ProtectedRoute>
              <Financial />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
