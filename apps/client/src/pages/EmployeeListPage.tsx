import { Link } from 'react-router-dom';

export function EmployeeListPage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Employees</h1>
            <p className="page-subtitle">Manage your organization's workforce.</p>
          </div>
          <Link to="/employees/new" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Employee
          </Link>
        </div>
      </header>

      <div className="form-card">
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px 0' }}>
          Employee list will be implemented in Phase 2.
        </p>
      </div>
    </div>
  );
}
