import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { User } from './types';
import { AuthContext } from './AuthDefinitions';
import api from '../api/Sapi';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      
      // ✅ Optionally verify token with backend
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
        })
        .catch(() => {
          // If token is invalid/expired, remove it
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {

      const response = await api.post('/auth/login', {
        email,
        password,
      } );

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setUser(user);

    } catch (err) {
      console.error(err);
    }

  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await api.post('/auth/register', {
        username,
        email,
        password,
      });

    } catch (err) {
      console.error(err);
    }

  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
