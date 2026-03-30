// Centralized configuration for API endpoints
// Vite automatically loads environment variables with the VITE_ prefix.
// Local: Uses 'http://localhost:3000' (default)
// Production (Vercel): Uses the value of VITE_API_URL set in Vercel project settings.

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  EMPLOYEES: `${API_BASE_URL}/employees`,
  DEPARTMENTS: `${API_BASE_URL}/departments`,
  LEAVE: `${API_BASE_URL}/leave-requests`,
};
