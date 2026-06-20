import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user's state (profile & wallet balance) from backend
  const refreshProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      const latestUserData = response.data.data;
      setUser(latestUserData);
      localStorage.setItem('spbklu_user_data', JSON.stringify(latestUserData));
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('spbklu_user_data');
    const storedToken = localStorage.getItem('spbklu_user_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      // Async fetch latest data in background to ensure up-to-date wallet balance
      refreshProfile();
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token } = response.data.data;

      if (userData.role !== 'user') {
        throw new Error('Akses ditolak. Silakan gunakan portal web admin untuk akun Administrator.');
      }

      setUser(userData);
      localStorage.setItem('spbklu_user_token', token);
      localStorage.setItem('spbklu_user_data', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Login gagal';
      return { success: false, error: errMsg };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { user: userData, token } = response.data.data;

      setUser(userData);
      localStorage.setItem('spbklu_user_token', token);
      localStorage.setItem('spbklu_user_data', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Registrasi gagal';
      return { success: false, error: errMsg };
    }
  };

  const loginWithGoogle = async (googleData) => {
    try {
      const response = await api.post('/auth/google', googleData);
      const { user: userData, token } = response.data.data;

      setUser(userData);
      localStorage.setItem('spbklu_user_token', token);
      localStorage.setItem('spbklu_user_data', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Login Google gagal';
      return { success: false, error: errMsg };
    }
  };

  const loginWithFacebook = async (fbData) => {
    try {
      const response = await api.post('/auth/facebook', fbData);
      const { user: userData, token } = response.data.data;

      setUser(userData);
      localStorage.setItem('spbklu_user_token', token);
      localStorage.setItem('spbklu_user_data', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Login Facebook gagal';
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('spbklu_user_token');
    localStorage.removeItem('spbklu_user_data');
    localStorage.removeItem('spbklu_active_charging_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, loginWithFacebook, logout, refreshProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
