import type { CreateEmployeePayload, Employee } from '../types/employee';

const BASE_URL = 'http://localhost:3000';

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
