import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import SwapQR from './pages/SwapQR';
import History from './pages/History';
import Profile from './pages/Profile';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Access Routs */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected App Tab View Routes */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="swap-qr" element={<SwapQR />} />
            <Route path="history" element={<History />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
