import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome back, <strong>{user?.fullName ?? 'User'}</strong>. Here's a quick overview of your HRMS.
        </p>
      </header>

      <div className="dashboard-grid">
        <Link to="/employees" className="dashboard-card">
          <div className="dashboard-card-icon dashboard-card-icon--indigo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3 className="dashboard-card-label">Employees</h3>
          <p className="dashboard-card-desc">Manage employee profiles and records</p>
        </Link>

        <Link to="/leave" className="dashboard-card">
          <div className="dashboard-card-icon dashboard-card-icon--emerald">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h3 className="dashboard-card-label">Leave</h3>
          <p className="dashboard-card-desc">Submit requests and track leave balances</p>
        </Link>

        <Link to="/attendance" className="dashboard-card">
          <div className="dashboard-card-icon dashboard-card-icon--amber">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h3 className="dashboard-card-label">Attendance</h3>
          <p className="dashboard-card-desc">View and manage daily attendance</p>
        </Link>

        <Link to="/payroll" className="dashboard-card">
          <div className="dashboard-card-icon dashboard-card-icon--rose">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <h3 className="dashboard-card-label">Payroll</h3>
          <p className="dashboard-card-desc">Generate payroll and view payslips</p>
        </Link>
      </div>
    </div>
  );
}
