import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const adminToken = localStorage.getItem('adminToken');
      const storedUser = localStorage.getItem('user');
      const storedAdminData = localStorage.getItem('adminData');
      
      if (adminToken && storedAdminData) {
        // Admin is logged in
        const adminData = JSON.parse(storedAdminData);
        setUser(adminData);
        setIsAuthenticated(true);
      } else if (token && storedUser) {
        // Regular advisor is logged in
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            setUser(response.advisor);
            setIsAuthenticated(true);
          } else {
            // If failed, clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    } catch {
      // If error, clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
    } finally {
      setLoading(false);
    }
  };

  // Check if this is an admin login attempt
  const isAdminLogin = (credentials) => {
    const ADMIN_EMAIL = 'admin@richeai.com';
    const ADMIN_PASSWORD = 'admin123';
    
    return credentials.email === ADMIN_EMAIL && credentials.password === ADMIN_PASSWORD;
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      
      // Check if this is an admin login attempt
      if (isAdminLogin(credentials)) {
        console.log('🔧 ADMIN LOGIN: Processing admin login locally');
        
        // Handle admin login locally (no API call)
        const adminData = {
          id: 'admin',
          email: 'admin@richeai.com',
          name: 'System Administrator',
          role: 'admin',
          isAdmin: true
        };

        // Store admin session
        localStorage.setItem('adminToken', 'admin-session-token');
        localStorage.setItem('adminData', JSON.stringify(adminData));
        
        setUser(adminData);
        setIsAuthenticated(true);
        
        console.log('✅ ADMIN LOGIN: Admin login successful');
        toast.success('Admin login successful!');
        return { success: true, user: adminData };
      }
      
      // Handle regular advisor login
      console.log('👤 ADVISOR LOGIN: Processing advisor login via API');
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        // Store token and user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.advisor));
        
        setUser(response.advisor);
        setIsAuthenticated(true);
        
        console.log('✅ ADVISOR LOGIN: Advisor login successful');
        toast.success('Login successful!');
        return { success: true, user: response.advisor };
      } else {
        toast.error(response.message || 'Login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('💥 LOGIN ERROR:', error);
      let message = 'Login failed. Please try again.';
      
      // Handle specific error types
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      
      if (response.success) {
        // Store token and user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.advisor));
        
        setUser(response.advisor);
        setIsAuthenticated(true);
        
        toast.success('Registration successful!');
        return { success: true, user: response.advisor };
      } else {
        toast.error(response.message || 'Registration failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      let message = 'Registration failed. Please try again.';
      
      // Handle specific error types
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Check if admin is logged in
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        // Admin logout - just clear local storage
        console.log('🚪 ADMIN LOGOUT: Clearing admin session');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
      } else {
        // Regular advisor logout
        console.log('🚪 ADVISOR LOGOUT: Logging out advisor via API');
        try {
          await authAPI.logout();
        } catch (error) {
          console.warn('⚠️ LOGOUT API FAILED:', error.message);
          // Continue with local cleanup even if API fails
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('✅ LOGOUT SUCCESS: User logged out successfully');
      toast.success('Logged out successfully!');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};