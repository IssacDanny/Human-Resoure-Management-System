import { API_BASE_URL } from './config';
import type { CreateEmployeePayload, UpdateEmployeePayload, Employee, Department } from '../types/employee';

const BASE_URL = API_BASE_URL;

// Using an interface + factory instead of a class to comply with erasableSyntaxOnly
export interface ApiError extends Error {
  statusCode: number;
}

export function createApiError(statusCode: number, message: string): ApiError {
  const err = new Error(message) as ApiError;
  err.name = 'ApiError';
  err.statusCode = statusCode;
  return err;
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof Error && err.name === 'ApiError';
}

/**
 * Creates a new employee by calling POST /employees.
 * The server will auto-generate a default password hash.
 * @throws {ApiError} for 4xx/5xx responses
 */
export async function createEmployee(payload: CreateEmployeePayload, token: string): Promise<Employee> {
  const response = await fetch(`${BASE_URL}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  });

  // Parse JSON regardless of status to get error messages from the server
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw createApiError(response.status, 'Server returned an unexpected response.');
  }

  if (!response.ok) {
    // NestJS validation errors come back as { message: string[] | string, error: string, statusCode: number }
    const errorData = data as { message?: string | string[]; error?: string };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? errorData.error ?? 'An unknown error occurred.');
    throw createApiError(response.status, message);
  }

  return data as Employee;
}

/**
 * Fetches all departments from GET /departments.
 * @throws {ApiError} for 4xx/5xx responses
 */
export async function fetchDepartments(token: string): Promise<Department[]> {
  const response = await fetch(`${BASE_URL}/departments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw createApiError(response.status, 'Server returned an unexpected response.');
  }

  if (!response.ok) {
    const errorData = data as { message?: string | string[]; error?: string };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? errorData.error ?? 'An unknown error occurred.');
    throw createApiError(response.status, message);
  }

  // Server returns { data: Department[] }
  const apiResponse = data as { data?: Department[] };
  return apiResponse.data ?? [];
}

/**
 * Creates a new department by calling POST /departments.
 * @throws {ApiError} for 4xx/5xx responses
 */
export async function createDepartment(name: string, token: string): Promise<Department> {
  const response = await fetch(`${BASE_URL}/departments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name }),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw createApiError(response.status, 'Server returned an unexpected response.');
  }

  if (!response.ok) {
    const errorData = data as { message?: string | string[]; error?: string };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? errorData.error ?? 'An unknown error occurred.');
    throw createApiError(response.status, message);
  }

  return data as Department;
}

/**
 * Fetches only active departments (isActive === true).
 * Use this for Create/Edit Employee forms to prevent assigning users to inactive departments.
 */
export async function fetchActiveDepartments(token: string): Promise<Department[]> {
  const all = await fetchDepartments(token);
  return all.filter(d => d.isActive);
}

/**
 * Fetches all employees from GET /employees.
 * @throws {ApiError} for 4xx/5xx responses
 */
export async function fetchEmployees(token: string): Promise<Employee[]> {
  const response = await fetch(`${BASE_URL}/employees`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw createApiError(response.status, 'Server returned an unexpected response.');
  }

  if (!response.ok) {
    const errorData = data as { message?: string | string[]; error?: string };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? errorData.error ?? 'An unknown error occurred.');
    throw createApiError(response.status, message);
  }

  // Server returns { data: Employee[] }
  const apiResponse = data as { data?: Employee[] };
  return apiResponse.data ?? [];
}

/**
 * Fetches a single employee by ID from GET /employees/:id.
 * @throws {ApiError} for 4xx/5xx responses
 */
export async function getEmployeeById(id: string, token: string): Promise<Employee> {
  const response = await fetch(`${BASE_URL}/employees/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw createApiError(response.status, 'Server returned an unexpected response.');
  }

  if (!response.ok) {
    const errorData = data as { message?: string | string[]; error?: string };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? errorData.error ?? 'An unknown error occurred.');
    throw createApiError(response.status, message);
  }

  return data as Employee;
}

/**
 * Updates an employee by calling PATCH /employees/:id.
 * @throws {ApiError} for 4xx/5xx responses
 */
export async function updateEmployee(id: string, payload: UpdateEmployeePayload, token: string): Promise<Employee> {
  const response = await fetch(`${BASE_URL}/employees/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw createApiError(response.status, 'Server returned an unexpected response.');
  }

  if (!response.ok) {
    const errorData = data as { message?: string | string[]; error?: string };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? errorData.error ?? 'An unknown error occurred.');
    throw createApiError(response.status, message);
  }

  return data as Employee;
}
