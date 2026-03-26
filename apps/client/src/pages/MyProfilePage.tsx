import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEmployeeById, updateEmployee, isApiError } from '../api/employeeApi';
import { type Employee, type UpdateEmployeePayload } from '../types/employee';
import { FormField } from '../components/ui/FormField';

interface ProfileFormValues {
  phone: string;
  dob: string;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
}

interface ProfileFormErrors {
  phone?: string;
  dob?: string;
  address?: string;
  emergencyName?: string;
  emergencyPhone?: string;
}

const INITIAL_VALUES: ProfileFormValues = {
  phone: '',
  dob: '',
  address: '',
  emergencyName: '',
  emergencyPhone: '',
};

function validate(vals: ProfileFormValues): ProfileFormErrors {
  const errs: ProfileFormErrors = {};
  if (vals.dob && isNaN(Date.parse(vals.dob))) {
    errs.dob = 'Please enter a valid date.';
  }
  return errs;
}

export function MyProfilePage() {
  const { user, token } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState<ProfileFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !token) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setServerError(null);
        const emp = await getEmployeeById(user.id, token);
        setEmployee(emp);
        setValues({
          phone: emp.phone || '',
          dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
          address: emp.address || '',
          emergencyName: emp.emergencyName || '',
          emergencyPhone: emp.emergencyPhone || '',
        });
      } catch (err) {
        if (isApiError(err)) {
          setServerError(err.message);
        } else {
          setServerError('Failed to load profile data.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id, token]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ProfileFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccessMessage(null);
    setServerError(null);

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!employee?.id || !token) return;

    setIsSubmitting(true);
    try {
      const updatePayload: UpdateEmployeePayload = {};
      if (values.phone !== (employee.phone || '')) updatePayload.phone = values.phone || undefined;
      if (values.dob !== (employee.dob ? new Date(employee.dob).toISOString().split('T')[0] : '')) {
        updatePayload.dob = values.dob || undefined;
      }
      if (values.address !== (employee.address || '')) updatePayload.address = values.address || undefined;
      if (values.emergencyName !== (employee.emergencyName || '')) updatePayload.emergencyName = values.emergencyName || undefined;
      if (values.emergencyPhone !== (employee.emergencyPhone || '')) updatePayload.emergencyPhone = values.emergencyPhone || undefined;

      const updated = await updateEmployee(employee.id.toString(), updatePayload, token);
      setEmployee(updated);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      setValues({
        phone: updated.phone || '',
        dob: updated.dob ? new Date(updated.dob).toISOString().split('T')[0] : '',
        address: updated.address || '',
        emergencyName: updated.emergencyName || '',
        emergencyPhone: updated.emergencyPhone || '',
      });
    } catch (err) {
      if (isApiError(err)) {
        setServerError(err.message);
      } else {
        setServerError('Failed to update profile.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    if (employee) {
      setValues({
        phone: employee.phone || '',
        dob: employee.dob ? new Date(employee.dob).toISOString().split('T')[0] : '',
        address: employee.address || '',
        emergencyName: employee.emergencyName || '',
        emergencyPhone: employee.emergencyPhone || '',
      });
    }
    setErrors({});
    setIsEditing(false);
    setSuccessMessage(null);
    setServerError(null);
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="page-container">
        <div className="form-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <span className="spinner" style={{ width: 28, height: 28 }} />
          <p style={{ marginTop: 12, color: 'var(--color-text-muted)' }}>Loading profile…</p>
        </div>
      </div>
    );
  }

  // --- Error state (no employee loaded) ---
  if (serverError && !employee) {
    return (
      <div className="page-container">
        <div className="form-card">
          <div className="alert alert-error" role="alert">
            <span className="alert-icon" aria-hidden="true">✕</span>
            <span>{serverError}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          HRMS · My Profile
        </div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">View and update your personal information.</p>
      </header>

      {/* --- Read-only info card --- */}
      <div className="form-card" style={{ marginBottom: 24 }}>
        <div className="form-header">
          <div className="form-header-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h2 className="form-title">{employee.fullName}</h2>
            <p className="form-subtitle">{employee.workEmail}</p>
          </div>
        </div>

        <div className="form-row">
          <FormField id="ro-department" label="Department">
            <input
              id="ro-department"
              className="form-input"
              value={employee.department?.name || '—'}
              disabled
            />
          </FormField>
          <FormField id="ro-jobTitle" label="Job Title">
            <input
              id="ro-jobTitle"
              className="form-input"
              value={employee.jobTitle}
              disabled
            />
          </FormField>
        </div>

        <div className="form-row">
          <FormField id="ro-joinDate" label="Join Date">
            <input
              id="ro-joinDate"
              className="form-input"
              value={new Date(employee.joinDate).toLocaleDateString()}
              disabled
            />
          </FormField>
          <FormField id="ro-role" label="System Role">
            <input
              id="ro-role"
              className="form-input"
              value={employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
              disabled
            />
          </FormField>
        </div>
      </div>

      {/* --- Editable info card --- */}
      <div className="form-card">
        <div className="form-header">
          <div className="form-header-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="form-title">Personal Details</h2>
            <p className="form-subtitle">Update your contact and emergency information.</p>
          </div>
          {!isEditing && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => { setIsEditing(true); setSuccessMessage(null); }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {successMessage && (
          <div className="alert" style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success-ring)', color: 'var(--color-success)' }} role="status">
            <span className="alert-icon" aria-hidden="true">✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {serverError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon" aria-hidden="true">✕</span>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate aria-label="Edit profile form">
          {/* Row 1: Phone + DOB */}
          <div className="form-row">
            <FormField id="phone" label="Phone Number" error={errors.phone}>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`form-input ${errors.phone ? 'input-error' : ''}`}
                placeholder="e.g. +84 912 345 678"
                value={values.phone}
                onChange={handleChange}
                disabled={!isEditing}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                aria-invalid={!!errors.phone}
              />
            </FormField>

            <FormField id="dob" label="Date of Birth" error={errors.dob}>
              <input
                id="dob"
                name="dob"
                type="date"
                className={`form-input ${errors.dob ? 'input-error' : ''}`}
                value={values.dob}
                onChange={handleChange}
                disabled={!isEditing}
                aria-describedby={errors.dob ? 'dob-error' : undefined}
                aria-invalid={!!errors.dob}
              />
            </FormField>
          </div>

          {/* Row 2: Address (full width) */}
          <div className="form-row">
            <FormField id="address" label="Address" error={errors.address}>
              <input
                id="address"
                name="address"
                type="text"
                className={`form-input ${errors.address ? 'input-error' : ''}`}
                placeholder="e.g. 123 Nguyen Hue, District 1"
                value={values.address}
                onChange={handleChange}
                disabled={!isEditing}
                aria-describedby={errors.address ? 'address-error' : undefined}
                aria-invalid={!!errors.address}
              />
            </FormField>
          </div>

          {/* Row 3: Emergency Contact */}
          <div className="form-row">
            <FormField id="emergencyName" label="Emergency Contact Name" error={errors.emergencyName}>
              <input
                id="emergencyName"
                name="emergencyName"
                type="text"
                className={`form-input ${errors.emergencyName ? 'input-error' : ''}`}
                placeholder="e.g. Tran Thi B"
                value={values.emergencyName}
                onChange={handleChange}
                disabled={!isEditing}
                aria-describedby={errors.emergencyName ? 'emergencyName-error' : undefined}
                aria-invalid={!!errors.emergencyName}
              />
            </FormField>

            <FormField id="emergencyPhone" label="Emergency Contact Phone" error={errors.emergencyPhone}>
              <input
                id="emergencyPhone"
                name="emergencyPhone"
                type="tel"
                className={`form-input ${errors.emergencyPhone ? 'input-error' : ''}`}
                placeholder="e.g. +84 987 654 321"
                value={values.emergencyPhone}
                onChange={handleChange}
                disabled={!isEditing}
                aria-describedby={errors.emergencyPhone ? 'emergencyPhone-error' : undefined}
                aria-invalid={!!errors.emergencyPhone}
              />
            </FormField>
          </div>

          {/* Footer */}
          {isEditing && (
            <div className="form-footer">
              <p className="footer-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Only personal details can be updated. Job info is managed by HR.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}