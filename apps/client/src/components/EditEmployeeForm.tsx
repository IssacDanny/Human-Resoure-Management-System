import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Role, mapRoleToServer, type Employee, type Department } from '../types/employee';
import { fetchDepartments, isApiError, type ApiError } from '../api/employeeApi';
import { API_BASE_URL } from '../api/config';
import { FormField } from './ui/FormField';
import { useAuth } from '../contexts/AuthContext';

// --- Form State Types ---

interface FormValues {
  fullName: string;
  workEmail: string;
  department: string;
  jobTitle: string;
  basicSalary: string;
  role: Role | '';
}

interface FormErrors {
  fullName?: string;
  workEmail?: string;
  department?: string;
  jobTitle?: string;
  basicSalary?: string;
  role?: string;
}

const INITIAL_VALUES: FormValues = {
  fullName: '',
  workEmail: '',
  department: '',
  jobTitle: '',
  basicSalary: '',
  role: '',
};

// --- Validation ---

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  }

  if (!values.workEmail.trim()) {
    errors.workEmail = 'Work email is required.';
  } else if (!EMAIL_REGEX.test(values.workEmail)) {
    errors.workEmail = 'Please enter a valid email address.';
  }

  if (!values.department.trim()) {
    errors.department = 'Department is required.';
  }

  if (!values.jobTitle.trim()) {
    errors.jobTitle = 'Job title is required.';
  }

  if (values.basicSalary === '') {
    errors.basicSalary = 'Basic salary is required.';
  } else if (isNaN(Number(values.basicSalary)) || Number(values.basicSalary) <= 0) {
    errors.basicSalary = 'Salary must be a number greater than 0.';
  }

  if (!values.role) {
    errors.role = 'Please select a role.';
  }

  return errors;
}

// --- Main Component ---

export function EditEmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successEmployee, setSuccessEmployee] = useState<Employee | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load employee data and departments
  useEffect(() => {
    if (!token || !id) return;

    const loadData = async () => {
      try {
        // Load employee data
        const empRes = await fetch(`${API_BASE_URL}/employees/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!empRes.ok) {
          throw new Error('Failed to load employee data');
        }

        const employee: Employee = await empRes.json();

        // Load departments
        setDeptLoading(true);
        const depts = await fetchDepartments(token);
        setDepartments(depts);
        setDeptError(null);

        // Set form values
        setValues({
          fullName: employee.fullName,
          workEmail: employee.workEmail,
          department: employee.department?.id?.toString() || '',
          jobTitle: employee.jobTitle,
          basicSalary: employee.basicSalary?.toString() || '',
          role: employee.role.toLowerCase() as Role,
        });
      } catch (err) {
        setServerError((err as Error).message || 'Failed to load data.');
      } finally {
        setLoading(false);
        setDeptLoading(false);
      }
    };

    loadData();
  }, [token, id]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);

    // Client-side validation
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!token || !id) {
      setServerError('Authentication token missing. Please log in again.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      fullName: values.fullName.trim(),
      workEmail: values.workEmail.trim(),
      departmentId: Number(values.department),
      jobTitle: values.jobTitle.trim(),
      basicSalary: Number(values.basicSalary),
      role: mapRoleToServer(values.role as Role),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update (${res.status})`);
      }

      const updatedEmployee: Employee = await res.json();
      setSuccessEmployee(updatedEmployee);
    } catch (err: unknown) {
      if (isApiError(err)) {
        const apiErr = err as ApiError;
        setServerError(apiErr.message);
      } else {
        setServerError('Unable to connect to the server. Please ensure the backend is running.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    navigate('/employees');
  }

  // --- Loading State ---
  if (loading) {
    return (
      <div className="form-card">
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px 0' }}>
          Loading employee data...
        </p>
      </div>
    );
  }

  // --- Success State ---
  if (successEmployee) {
    return (
      <div className="form-card" role="status" aria-live="polite">
        <div className="success-banner">
          <div className="success-icon" aria-hidden="true">✓</div>
          <h2 className="success-title">Employee Updated!</h2>
          <p className="success-message">
            <strong>{successEmployee.fullName}</strong> has been successfully updated.
          </p>
          <div className="success-details">
            <span className="detail-chip">{successEmployee.department?.name}</span>
            <span className="detail-chip">{successEmployee.jobTitle}</span>
          </div>
          <button className="btn btn-primary" onClick={handleReset}>
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  // --- Form ---
  return (
    <div className="form-card">
      <div className="form-header">
        <div className="form-header-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
        </div>
        <div>
          <h2 className="form-title">Edit Employee</h2>
          <p className="form-subtitle">Update the employee details below.</p>
        </div>
      </div>

      {serverError && (
        <div className="alert alert-error" role="alert" aria-live="assertive">
          <span className="alert-icon" aria-hidden="true">✕</span>
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-label="Edit employee form">
        {/* Row 1: Full Name + Work Email */}
        <div className="form-row">
          <FormField id="fullName" label="Full Name" error={errors.fullName} required>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className={`form-input ${errors.fullName ? 'input-error' : ''}`}
              placeholder="e.g. Nguyen Van A"
              value={values.fullName}
              onChange={handleChange}
              autoComplete="name"
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              aria-invalid={!!errors.fullName}
            />
          </FormField>

          <FormField id="workEmail" label="Work Email" error={errors.workEmail} required>
            <input
              id="workEmail"
              name="workEmail"
              type="email"
              className={`form-input ${errors.workEmail ? 'input-error' : ''}`}
              placeholder="e.g. a.nguyen@company.com"
              value={values.workEmail}
              onChange={handleChange}
              autoComplete="email"
              aria-describedby={errors.workEmail ? 'workEmail-error' : undefined}
              aria-invalid={!!errors.workEmail}
            />
          </FormField>
        </div>

        {/* Row 2: Department + Job Title */}
        <div className="form-row">
          <FormField id="department" label="Department" error={errors.department} required>
            {deptError && (
              <div className="alert alert-error" style={{ marginBottom: '8px', fontSize: '0.875rem' }}>
                {deptError}
              </div>
            )}
            <select
              id="department"
              name="department"
              className={`form-input ${errors.department ? 'input-error' : ''}`}
              value={values.department}
              onChange={handleChange}
              disabled={deptLoading}
              aria-describedby={errors.department ? 'department-error' : undefined}
              aria-invalid={!!errors.department}
            >
              <option value="">{deptLoading ? 'Loading departments...' : 'Select a department'}</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="jobTitle" label="Job Title" error={errors.jobTitle} required>
            <input
              id="jobTitle"
              name="jobTitle"
              type="text"
              className={`form-input ${errors.jobTitle ? 'input-error' : ''}`}
              placeholder="e.g. Senior Developer"
              value={values.jobTitle}
              onChange={handleChange}
              aria-describedby={errors.jobTitle ? 'jobTitle-error' : undefined}
              aria-invalid={!!errors.jobTitle}
            />
          </FormField>
        </div>

        {/* Row 3: Basic Salary + Role */}
        <div className="form-row">
          <FormField id="basicSalary" label="Basic Salary (VND)" error={errors.basicSalary} required>
            <input
              id="basicSalary"
              name="basicSalary"
              type="number"
              className={`form-input ${errors.basicSalary ? 'input-error' : ''}`}
              placeholder="e.g. 15000000"
              value={values.basicSalary}
              onChange={handleChange}
              min="0"
              step="500000"
              aria-describedby={errors.basicSalary ? 'basicSalary-error' : undefined}
              aria-invalid={!!errors.basicSalary}
            />
          </FormField>

          <FormField id="role" label="System Role" error={errors.role} required>
            <select
              id="role"
              name="role"
              className={`form-select ${errors.role ? 'input-error' : ''}`}
              value={values.role}
              onChange={handleChange}
              aria-describedby={errors.role ? 'role-error' : undefined}
              aria-invalid={!!errors.role}
            >
              <option value="" disabled>Select a role…</option>
              <option value={Role.employee}>Employee</option>
              <option value={Role.manager}>Manager</option>
              <option value={Role.admin}>Admin / HR</option>
            </select>
          </FormField>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/employees')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Employee'}
          </button>
        </div>
      </form>
    </div>
  );
}