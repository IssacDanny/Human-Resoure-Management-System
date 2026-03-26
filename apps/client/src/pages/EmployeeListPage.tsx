import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/employee';

export function EmployeeListPage() {
  const { user } = useAuth();
  const isBlocked = user?.role === Role.employee;

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
        ) : (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px 0' }}>
            Employee list will be implemented in Phase 2.
          </p>
        )}
      </div>
    </div>
  );
}
