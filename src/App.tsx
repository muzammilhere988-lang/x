import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {ProtectedAdminRoute} from './components/auth/ProtectedAdminRoute';
import {AdminDashboardPage} from './pages/AdminDashboardPage';
import {AdminLoginPage} from './pages/AdminLoginPage';
import {PublicMenuPage} from './pages/PublicMenuPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/menu" replace />} />
        <Route path="/menu" element={<PublicMenuPage />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              {(auth) => <AdminDashboardPage auth={auth} />}
            </ProtectedAdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
