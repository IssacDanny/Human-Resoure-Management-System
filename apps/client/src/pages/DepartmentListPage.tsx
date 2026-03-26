import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchDepartments } from '../api/employeeApi';
import type { Department } from '../types/employee';

export function DepartmentListPage() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');
    fetchDepartments(token)
      .then((data) => setDepartments(data))
      .catch((err) => setError((err as Error).message || 'Failed to load departments.'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Departments</h1>
            <p className="page-subtitle">Manage organization departments.</p>
          </div>
        </div>
      </header>

      <div className="form-card">
        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px 0' }}>Loading departments...</p>
        ) : error ? (
          <div className="alert alert-error" style={{ justifyContent: 'center' }}>
            <span className="alert-icon">⚠️</span>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        ) : departments.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px 0' }}>
            No departments found.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', width: '10%' }}>ID</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', width: '30%' }}>Name</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', width: '20%' }}>Employees</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', width: '15%' }}>Status</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', width: '25%' }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', verticalAlign: 'top' }}>{dept.id}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', verticalAlign: 'top' }}>{dept.name}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', verticalAlign: 'top' }}>{dept.employees?.length ?? 0}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', verticalAlign: 'top' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      background: dept.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: dept.isActive ? '#10b981' : '#ef4444',
                    }}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', verticalAlign: 'top' }}>
                    {new Date(dept.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
