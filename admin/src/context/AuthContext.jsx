import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('spbklu_admin_user');
    const storedToken = localStorage.getItem('spbklu_admin_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token } = response.data.data;

      // Validate that the user logging in is indeed an Admin
      if (userData.role !== 'admin') {
        throw new Error('Akses ditolak. Endpoint ini khusus untuk akun Admin.');
      }

      // Store in state and localStorage
      setUser(userData);
      localStorage.setItem('spbklu_admin_token', token);
      localStorage.setItem('spbklu_admin_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Login gagal';
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('spbklu_admin_token');
    localStorage.removeItem('spbklu_admin_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
