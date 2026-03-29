import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { BrandProvider } from './context/BrandContext';
import { TagProvider } from './context/TagContext';
import { PlatformProvider } from './context/PlatformContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import SolicitanteDashboard from './pages/SolicitanteDashboard';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen" style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}>Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const RootDashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'solicitante') {
    return <SolicitanteDashboard />;
  }
  return <Dashboard />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrandProvider>
          <TagProvider>
            <PlatformProvider>
              <Router>
                <NotificationProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Layout>
                        <RootDashboard />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/team" element={
                    <ProtectedRoute requireAdmin={true}>
                      <Layout>
                        <Team />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/reports" element={
                    <ProtectedRoute requireAdmin={true}>
                      <Layout>
                        <Reports />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute requireAdmin={true}>
                      <Layout>
                        <Settings />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  } />
                </Routes>
                </NotificationProvider>
              </Router>
            </PlatformProvider>
          </TagProvider>
        </BrandProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
