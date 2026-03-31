import './index.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateEmployeePage } from './pages/CreateEmployeePage';
import { EditEmployeePage } from './pages/EditEmployeePage';
import { EmployeeListPage } from './pages/EmployeeListPage';
import { MyProfilePage } from './pages/MyProfilePage';
import { DepartmentListPage } from './pages/DepartmentListPage';
import { AttendancePage } from './pages/AttendancePage';
import { PlaceholderPage } from './pages/PlaceholderPage';

// Protected Route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Login Page at root */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Employee Management */}
        <Route path="/employees" element={<EmployeeListPage />} />
        <Route path="/employees/new" element={<CreateEmployeePage />} />
        <Route path="/employees/:id/edit" element={<EditEmployeePage />} />

        {/* Placeholder routes for future phases */}
        <Route path="/departments" element={<DepartmentListPage />} />
        <Route
          path="/leave"
          element={<PlaceholderPage title="Leave Management" description="Submit and manage leave requests." />}
        />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route
          path="/payroll"
          element={<PlaceholderPage title="Payroll" description="Generate payroll and view payslips." />}
        />
        <Route path="/my-profile" element={<MyProfilePage />} />

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
