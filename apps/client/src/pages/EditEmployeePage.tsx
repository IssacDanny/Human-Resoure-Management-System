import { EditEmployeeForm } from '../components/EditEmployeeForm';

export function EditEmployeePage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          HRMS · Employee Management
        </div>
        <h1 className="page-title">Edit Employee</h1>
        <p className="page-subtitle">
          Update employee information and system access.
        </p>
      </header>

      <EditEmployeeForm />
    </div>
  );
}