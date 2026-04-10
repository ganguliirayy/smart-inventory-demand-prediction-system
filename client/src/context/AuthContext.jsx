import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('rxflow_user');
    const savedToken = localStorage.getItem('rxflow_token');
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch {
        localStorage.removeItem('rxflow_user');
        localStorage.removeItem('rxflow_token');
      }
    }
    setLoading(false);
  }, []);

  // SIGNUP FUNCTION - Creates new account in MongoDB
  const signup = async (name, email, password, phone = '') => {
    if (!name || !email || !password) {
      return { success: false, message: 'All fields are required' };
    }

    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = data.user;
        const token = data.token;
        
        localStorage.setItem('rxflow_user', JSON.stringify(userData));
        localStorage.setItem('rxflow_token', token);
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Unable to connect to server. Please try again.' };
    }
  };

  // LOGIN FUNCTION - Authenticates user from MongoDB
  const login = async (email, password) => {
    if (!email || !password) {
      return { success: false, message: 'Email and password are required' };
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = data.user;
        const token = data.token;
        
        localStorage.setItem('rxflow_user', JSON.stringify(userData));
        localStorage.setItem('rxflow_token', token);
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Unable to connect to server. Please try again.' };
    }
  };

  // LOGOUT FUNCTION
  const logout = async () => {
    try {
      const token = localStorage.getItem('rxflow_token');
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }
    
    localStorage.removeItem('rxflow_user');
    localStorage.removeItem('rxflow_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.isAdmin === true,
      isCustomer: user?.role === 'customer',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// API helper for authenticated requests
export const api = {
  get: async (endpoint) => {
    const token = localStorage.getItem('rxflow_token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return { data: await response.json() };
  },
  post: async (endpoint, body) => {
    const token = localStorage.getItem('rxflow_token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return { data: await response.json() };
  },
  put: async (endpoint, body) => {
    const token = localStorage.getItem('rxflow_token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return { data: await response.json() };
  },
  delete: async (endpoint) => {
    const token = localStorage.getItem('rxflow_token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return { data: await response.json() };
  },
};