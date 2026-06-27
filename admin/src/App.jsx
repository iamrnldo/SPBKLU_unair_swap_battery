import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Stations from './pages/Stations';
import Batteries from './pages/Batteries';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Access Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes Layout */}
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="stations" element={<Stations />} />
            <Route path="batteries" element={<Batteries />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch All Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
