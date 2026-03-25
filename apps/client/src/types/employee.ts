// Using a const object + union type instead of enum
// to comply with erasableSyntaxOnly (tsconfig.app.json)
export const Role = {
  admin: 'admin',
  manager: 'manager',
  employee: 'employee',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface CreateEmployeePayload {
  fullName: string;
  workEmail: string;
  // NOTE: The API contract spec uses 'department', but the actual server DTO
  // uses 'departmentId' (MVP placeholder for a future relation). We follow
  // the server DTO so the request body is accepted by the real endpoint.
  department: string;
  jobTitle: string;
  basicSalary: number;
  joinDate: string; // ISO date string: YYYY-MM-DD
  // NOTE: API contract specifies [admin, manager, employee] but the server
  // Prisma enum uses ADMIN_HR | MANAGER | EMPLOYEE — we follow the server.
  role: Role;
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
  jobTitle: string;
  basicSalary?: number;
  status: 'active' | 'inactive';
  role: Role;
  joinDate: string;
  createdAt: string;
}
