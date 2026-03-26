import { createContext, useContext, useState, type ReactNode } from 'react';
import { Role } from '../types/employee';

// --- Auth Types ---

export interface AuthUser {
  id: string;
  fullName: string;
  workEmail: string;
  departmentId: number;
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

type ApiRole = 'ADMIN_HR' | 'MANAGER' | 'EMPLOYEE';

type LoginApiResponse = {
  accessToken: string;
  expiresIn: number;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: ApiRole;
    jobTitle: string;
    departmentId?: number;
  };
};

function mapApiRole(role: ApiRole): Role {
  switch (role) {
    case 'ADMIN_HR':
      return Role.admin;
    case 'MANAGER':
      return Role.manager;
    case 'EMPLOYEE':
      return Role.employee;
    default:
      return Role.employee;
  }
}

// --- Default initial state (unauthenticated) ---


// --- Context ---

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('hrms_user');
    return saved ? JSON.parse(saved) as AuthUser : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('hrms_token');
  });

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === Role.admin;
  const isManager = user?.role === Role.manager;
  const isEmployee = user?.role === Role.employee;

  async function login(email: string, password: string) {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = (await response.json()) as LoginApiResponse;

    const loggedInUser: AuthUser = {
      id: String(data.user.id),
      fullName: data.user.fullName,
      workEmail: data.user.email,
      departmentId: data.user.departmentId ?? 0,
      jobTitle: data.user.jobTitle,
      role: mapApiRole(data.user.role),
    };

    setUser(loggedInUser);
    setToken(data.accessToken);
    localStorage.setItem('hrms_user', JSON.stringify(loggedInUser));
    localStorage.setItem('hrms_token', data.accessToken);
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hrms_user');
    localStorage.removeItem('hrms_token');
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
