import { createContext, useContext, useState, useCallback } from 'react';
import { getStoredPassword, clearStoredPassword } from '@/lib/apiClient';
import { login as apiLogin } from '@/api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(() => Boolean(getStoredPassword()));

  const login = useCallback((password) => {
    apiLogin(password);
    setAuthed(true);
  }, []);

  const logout = useCallback(() => {
    clearStoredPassword();
    setAuthed(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authed, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
