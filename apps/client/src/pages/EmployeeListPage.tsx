import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/employee';

type RawEmployee = {
  id: number;
  fullName: string;
  workEmail: string;
  role: 'ADMIN_HR' | 'MANAGER' | 'EMPLOYEE';
  status: string;
  joinDate: string;
  basicSalary: string;
  departmentId: number;
  jobTitle: string;
};

export function EmployeeListPage() {
  const { user, token } = useAuth();
  const isBlocked = user?.role === Role.employee;
  const [employees, setEmployees] = useState<RawEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  async function loadEmployees() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3000/employees', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch (${res.status})`);
      }

      const { data } = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }

  async function deactivateEmployee(employeeId: number) {
    if (!token) return;
    setDeactivatingId(employeeId);

    try {
      const res = await fetch(`http://localhost:3000/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'INACTIVE' }),
      });

      if (!res.ok) {
        throw new Error(`Failed to deactivate (${res.status})`);
      }

      await loadEmployees();
    } catch (err) {
      setError((err as Error).message || 'Failed to deactivate employee.');
    } finally {
      setDeactivatingId(null);
    }
  }

  useEffect(() => {
    if (!user || isBlocked) return;
    loadEmployees();
  }, [user, isBlocked, token]);

  const visibleEmployees = useMemo(() => {
    if (!user) return [];
    if (user.role === Role.admin) return employees;
    if (user.role === Role.manager) {
      const deptId = Number(user.department);
      if (!Number.isNaN(deptId)) {
        return employees.filter((emp) => emp.departmentId === deptId);
      }
      return employees;
    }
    return [];
  }, [user, employees]);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Employees</h1>
            <p className="page-subtitle">Manage your organization's workforce.</p>
          </div>
          {!isBlocked && (
            <Link to="/employees/new" className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Employee
            </Link>
          )}
        </div>
      </header>

      <div className="form-card">
        {isBlocked ? (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Access denied</strong>
              <p style={{ margin: 0 }}>
                Only Admin/HR and Manager can view this page.
              </p>
            </div>
          </div>
        ) : loading ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px 0' }}>Loading employees...</p>
        ) : error ? (
          <div className="alert alert-error" style={{ justifyContent: 'center' }}>
            <span className="alert-icon">⚠️</span>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        ) : (
          <div>
            {visibleEmployees.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px 0' }}>
                No employees found for your role/department.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>Name</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>Email</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>Role</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>Department ID</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>Job Title</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>Status</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>{emp.fullName}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>{emp.workEmail}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>{emp.role}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>{emp.departmentId}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>{emp.jobTitle}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>{emp.status}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                        {emp.status === 'ACTIVE' ? (
                          <button
                            className="btn btn-danger"
                            disabled={deactivatingId === emp.id}
                            onClick={() => deactivateEmployee(emp.id)}
                          >
                            {deactivatingId === emp.id ? 'Deactivating...' : 'Deactivate'}
                          </button>
                        ) : (
                          'Inactive'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
