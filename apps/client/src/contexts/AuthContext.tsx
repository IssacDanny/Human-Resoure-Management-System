import { createContext, useContext, useState, type ReactNode } from 'react';
import { Role } from '../types/employee';

// --- Auth Types ---

export interface AuthUser {
  id: string;
  fullName: string;
  workEmail: string;
  department: string;
  jobTitle: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: Role) => void; // Dev-only helper for testing role-based UI
}

// --- Mock Admin User ---

const MOCK_ADMIN: AuthUser = {
  id: 'mock-admin-001',
  fullName: 'System Admin',
  workEmail: 'admin@hrms.internal',
  department: 'Human Resources',
  jobTitle: 'HR Administrator',
  role: Role.ADMIN_HR,
};

// --- Context ---

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(MOCK_ADMIN);
  const [token, setToken] = useState<string | null>('mock-jwt-token');

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === Role.admin;
  const isManager = user?.role === Role.MANAGER;
  const isEmployee = user?.role === Role.EMPLOYEE;

  async function login(_email: string, _password: string) {  // eslint-disable-line @typescript-eslint/no-unused-vars
    // TODO: Replace with real API call to POST /auth/login
    // const response = await fetch('http://localhost:3000/auth/login', { ... });
    setUser(MOCK_ADMIN);
    setToken('mock-jwt-token');
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  // Dev helper: quickly switch role to test role-based UI
  function switchRole(role: Role) {
    if (user) {
      setUser({ ...user, role });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isManager,
        isEmployee,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
