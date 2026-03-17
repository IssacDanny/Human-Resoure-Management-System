import { CreateEmployeeForm } from '../components/CreateEmployeeForm';

export function CreateEmployeePage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          HRMS · Employee Management
        </div>
        <h1 className="page-title">Add New Employee</h1>
        <p className="page-subtitle">
          Register a new team member and configure their system access.
        </p>
      </header>

      <CreateEmployeeForm />
    </div>
  );
}
