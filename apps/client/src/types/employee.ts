// Using a const object + union type instead of enum
// to comply with erasableSyntaxOnly (tsconfig.app.json)
export const Role = {
  admin: 'admin',
  manager: 'manager',
  employee: 'employee',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

// Server role format (uppercase)
export type ServerRole = 'ADMIN_HR' | 'MANAGER' | 'EMPLOYEE';

// Map internal role to server format
export function mapRoleToServer(role: Role): ServerRole {
  switch (role) {
    case 'admin':
      return 'ADMIN_HR';
    case 'manager':
      return 'MANAGER';
    case 'employee':
      return 'EMPLOYEE';
  }
}

export interface CreateEmployeePayload {
  fullName: string;
  workEmail: string;
  departmentId: number; // Changed from 'department: string'
  jobTitle: string;
  basicSalary: number;
  joinDate: string; // ISO date string: YYYY-MM-DD
  role: ServerRole; // Changed to ServerRole (ADMIN_HR | MANAGER | EMPLOYEE)
}

// Employee response shape returned by the server (raw Prisma model)
export interface Employee {
  id: number;
  fullName: string;
  workEmail: string;
  personalEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  department: string;
  departmentId?: number; // Added for when department is included
  department?: Department; // Added for when department relation is included
  jobTitle: string;
  basicSalary?: number;
  status: 'active' | 'inactive';
  role: Role;
  joinDate: string;
  createdAt: string;
}

// Department response shape from the server API
export interface Department {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  employees: Employee[];
}
