import './index.css';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateEmployeePage } from './pages/CreateEmployeePage';
import { EmployeeListPage } from './pages/EmployeeListPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />

        {/* Employee Management */}
        <Route path="/employees" element={<EmployeeListPage />} />
        <Route path="/employees/new" element={<CreateEmployeePage />} />

        {/* Placeholder routes for future phases */}
        <Route
          path="/departments"
          element={<PlaceholderPage title="Departments" description="Manage organization departments." />}
        />
        <Route
          path="/leave"
          element={<PlaceholderPage title="Leave Management" description="Submit and manage leave requests." />}
        />
        <Route
          path="/attendance"
          element={<PlaceholderPage title="Attendance" description="Track daily attendance records." />}
        />
        <Route
          path="/payroll"
          element={<PlaceholderPage title="Payroll" description="Generate payroll and view payslips." />}
        />
        <Route
          path="/my-profile"
          element={<PlaceholderPage title="My Profile" description="View and update your personal information." />}
        />

        {/* Catch-all */}
        <Route
          path="*"
          element={<PlaceholderPage title="404 — Not Found" description="The page you're looking for doesn't exist." />}
        />
      </Route>
    </Routes>
  );
}

export default App;
