import { createContext, useContext, useMemo, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Helper to load users from localStorage
const loadUsers = () => {
  try {
    const saved = localStorage.getItem('clinicmate_users');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load users:', err);
  }
  // Default demo users if nothing in localStorage
  return [
    { id: '1', name: 'Admin',     email: 'admin@clinicmate.demo',  password: 'admin'  },
    { id: '2', name: 'Admin One', email: 'admin1@clinicmate.demo', password: 'admin1' },
  ];
};

export function AuthProvider({ children }) {
  // Load users from localStorage on mount
  const [users, setUsers] = useState(loadUsers);
  const [user, setUser] = useState(null);
  
  // Save users to localStorage whenever they change
  useEffect(() => {
    console.log('📋 Current users:', users);
    localStorage.setItem('clinicmate_users', JSON.stringify(users));
  }, [users]);

  // Register a new user (no auto-login)
  const register = ({ firstName, lastName, email, password }) => {
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { ok: false, error: 'Email already registered.' };
    }
    const name = `${firstName} ${lastName}`.trim();
    const newUser = { id: String(users.length + 1), name, email, password };
    setUsers(prev => [...prev, newUser]);
    return { ok: true };
  };

  // Login with email + password
  const login = ({ email, password }) => {
    const found = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { ok: false, error: 'Invalid email or password.' };
    // store safe subset (omit password)
    setUser({ id: found.id, name: found.name, email: found.email });
    return { ok: true };
  };

  // Reset password for existing user
  const resetPassword = ({ email, newPassword }) => {
    const userIndex = users.findIndex(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
    
    if (userIndex === -1) {
      return { ok: false, error: 'Email not found.' };
    }

    // Update the user's password
    setUsers(prev => {
      const updated = [...prev];
      updated[userIndex] = { ...updated[userIndex], password: newPassword };
      return updated;
    });

    return { ok: true };
  };

  const logout = () => setUser(null);

  const value = useMemo(() => ({
    user,
    isAuthed: !!user,
    users,         
    register,
    login,
    logout,
    resetPassword
  }), [user, users]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}