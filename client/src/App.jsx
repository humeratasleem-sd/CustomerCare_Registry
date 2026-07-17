import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AuditLogs from './pages/AuditLogs';
import ComplaintDetails from './pages/ComplaintDetails';
import Feedbacks from './pages/Feedbacks';
import ManageCategories from './pages/ManageCategories';
import ManageUsers from './pages/ManageUsers';
import Profile from './pages/Profile';
import SupportTickets from './pages/SupportTickets';
import Settings from './pages/Settings';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
          </Route>

          {/* Protected Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            {/* Redirect root to login which handles redirection to dashboard if authenticated */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Customer Dashboard */}
            <Route path="/customer-dashboard" element={<CustomerDashboard />} />
            <Route path="/support-tickets" element={<SupportTickets />} />

            {/* Agent Dashboard */}
            <Route path="/agent-dashboard" element={<AgentDashboard />} />
            <Route path="/feedbacks" element={<Feedbacks />} />

            {/* Admin Dashboard */}
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/manage-users" element={<ManageUsers />} />
            <Route path="/manage-categories" element={<ManageCategories />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/settings" element={<Settings />} />

            {/* Shared Protected Pages */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/complaint/:id" element={<ComplaintDetails />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
