import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/config';
import { useAuth } from '../contexts/AuthContext';
import { fetchDepartments, createDepartment } from '../api/employeeApi';
import type { Department } from '../types/employee';

export function DepartmentListPage() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  function loadDepartments() {
    if (!token) return;
    setLoading(true);
    setError('');
    fetchDepartments(token)
      .then((data) => setDepartments(data))
      .catch((err) => setError((err as Error).message || 'Failed to load departments.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDepartments();
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newName.trim()) return;
    setCreating(true);
    setFormError('');
    try {
      await createDepartment(newName.trim(), token);
      setNewName('');
      setShowForm(false);
      loadDepartments();
    } catch (err) {
      setFormError((err as Error).message || 'Failed to create department.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(id: number) {
    if (!token) return;
    setDeactivatingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/departments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: false }),
      });
      if (!res.ok) throw new Error(`Failed to deactivate (${res.status})`);
      loadDepartments();
    } catch (err) {
      setError((err as Error).message || 'Failed to deactivate department.');
    } finally {
      setDeactivatingId(null);
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Departments</h1>
            <p className="page-subtitle">Manage organization departments.</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormError(''); }}>
            {showForm ? 'Cancel' : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Department
              </>
            )}
          </button>
        </div>
      </header>

      {showForm && (
        <div className="form-card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="dept-name">Department Name</label>
              <input
                id="dept-name"
                className="form-input"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Engineering"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating} style={{ whiteSpace: 'nowrap' }}>
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
          {formError && (
            <div className="alert alert-error" style={{ marginTop: '12px' }}>
              <span className="alert-icon">⚠️</span>
              <p style={{ margin: 0 }}>{formError}</p>
            </div>
          )}
        </div>
      )}

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
                <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', width: '30%' }}>Name</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', width: '20%' }}>Employees</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', width: '20%' }}>Status</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', width: '30%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
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
                    {dept.isActive && (dept.employees?.length ?? 0) === 0 ? (
                      <button
                        className="btn btn-danger"
                        disabled={deactivatingId === dept.id}
                        onClick={() => handleDeactivate(dept.id)}
                        style={{ fontSize: '0.875rem', padding: '6px 12px' }}
                      >
                        {deactivatingId === dept.id ? 'Deactivating...' : 'Deactivate'}
                      </button>
                    ) : !dept.isActive ? (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Inactive</span>
                    ) : null}
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
