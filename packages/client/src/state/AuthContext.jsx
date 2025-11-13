import { createContext, useContext, useMemo, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount (stored in memory/sessionStorage by backend)
  useEffect(() => {
    const checkSession = async () => {
      const token = sessionStorage.getItem('auth_token');
      console.log('🔐 Auth Token:', token ? 'Present' : 'Not found');
      
      if (token) {
        try {
          // Verify token is still valid by fetching profile
          const res = await fetch('/api/profile_data', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            const patient = data.patients;
            const userObj = {
              id: patient.user_id,
              email: patient.email,
              firstName: patient.first_name,
              lastName: patient.last_name,
              name: `${patient.first_name} ${patient.last_name}`.trim(),
              patientId: patient.patient_id,
            };
            console.log('👤 User Account Details:', userObj);
            console.log('📋 Full Patient Data:', patient);
            setUser(userObj);
          } else {
            console.log('❌ Token validation failed');
            sessionStorage.removeItem('auth_token');
          }
        } catch (err) {
          console.error('❌ Session check failed:', err);
          sessionStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  // Register a new user
  const register = async ({ firstName, lastName, email, password }) => {
    try {
      console.log('📝 Attempting registration for:', email);
      
      const res = await fetch('/api/sign_up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      // Check if response has content before parsing
      const text = await res.text();
      let data;
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('❌ Failed to parse response:', text);
        return { ok: false, error: 'Server returned invalid response. Please ensure the backend server is running.' };
      }

      console.log('📥 Registration response:', data);

      if (!res.ok) {
        console.log('❌ Registration failed:', data.error);
        
        // Better error messages
        let errorMsg = data.error || 'Registration failed';
        if (errorMsg.includes('duplicate') || errorMsg.includes('already')) {
          errorMsg = 'An account with this email already exists. Please log in instead.';
        } else if (errorMsg.includes('user_id_pkey')) {
          errorMsg = 'An account with this email already exists. Please log in instead.';
        }
        
        return { ok: false, error: errorMsg };
      }

      console.log('✅ Registration successful!');
      return { ok: true, message: 'Registration successful! Please check your email to verify your account.' };
    } catch (err) {
      console.error('❌ Registration error:', err);
      return { ok: false, error: err.message || 'Network error. Please check if the server is running.' };
    }
  };

  // Login with email + password
  const login = async ({ email, password }) => {
    try {
      console.log('🔑 Attempting login for:', email);
      
      const res = await fetch('/api/log_in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Check if response has content before parsing
      const text = await res.text();
      let data;
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('❌ Failed to parse response:', text);
        return { ok: false, error: 'Server returned invalid response. Please ensure the backend server is running.' };
      }

      console.log('📥 Login response:', data);

      if (!res.ok) {
        console.log('❌ Login failed:', data.error);
        return { ok: false, error: data.error || 'Login failed' };
      }

      // Store the token
      if (data.session?.access_token) {
        sessionStorage.setItem('auth_token', data.session.access_token);
        console.log('✅ Token stored');
        
        // Fetch user profile
        const profileRes = await fetch('/api/profile_data', {
          headers: { 'Authorization': `Bearer ${data.session.access_token}` }
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const patient = profileData.patients;
          const userObj = {
            id: patient.user_id,
            email: patient.email,
            firstName: patient.first_name,
            lastName: patient.last_name,
            name: `${patient.first_name} ${patient.last_name}`.trim(),
            patientId: patient.patient_id,
          };
          console.log('✅ Login successful! User Account:', userObj);
          console.log('📋 Full Patient Data:', patient);
          setUser(userObj);
        }
      }

      return { ok: true };
    } catch (err) {
      console.error('❌ Login error:', err);
      return { ok: false, error: err.message || 'Network error. Please check if the server is running.' };
    }
  };

  // Reset password
  const resetPassword = async ({ email }) => {
    try {
      const res = await fetch('/api/reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { ok: false, error: data.error || 'Failed to send reset email' };
      }

      return { ok: true, message: 'Password reset email sent.' };
    } catch (err) {
      console.error('Reset password error:', err);
      return { ok: false, error: err.message || 'Failed to send reset email.' };
    }
  };

  // Logout
  const logout = async () => {
    try {
      console.log('👋 Logging out...');
      const token = sessionStorage.getItem('auth_token');
      if (token) {
        await fetch('/api/log_out', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      sessionStorage.removeItem('auth_token');
      setUser(null);
      console.log('✅ Logout successful');
    } catch (err) {
      console.error('❌ Logout error:', err);
      sessionStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  // Get auth token for API calls
  const getToken = () => {
    return sessionStorage.getItem('auth_token');
  };

  const value = useMemo(() => ({
    user,
    loading,
    isAuthed: !!user,
    register,
    login,
    logout,
    resetPassword,
    getToken,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}