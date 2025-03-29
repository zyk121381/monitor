import { Routes, Route, Navigate } from 'react-router-dom';
import '@radix-ui/themes/styles.css';
import './styles/index.css';
import { useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

// 导入布局组件
import Layout from './components/Layout';

// 导入页面组件
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import MonitorsList from './pages/monitors/MonitorsList';
import MonitorDetail from './pages/monitors/MonitorDetail';
import CreateMonitor from './pages/monitors/CreateMonitor';
import EditMonitor from './pages/monitors/EditMonitor';
import AgentsList from './pages/agents/AgentsList';
import AgentDetail from './pages/agents/AgentDetail';
import UsersList from './pages/users/UsersList';
import UserProfile from './pages/users/UserProfile';
import NotFound from './pages/NotFound';
import StatusPage from './pages/status/StatusPage';
import StatusPageConfig from './pages/status/StatusPageConfig';
import CreateAgent from './pages/agents/CreateAgent';
import EditAgent from './pages/agents/EditAgent';
import NotificationsConfig from './pages/notifications/NotificationsConfig';

// 受保护的路由组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  
  if (isLoading) {
    return <div>{t('common.loading')}</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// 管理员路由组件
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useTranslation();
  
  if (isLoading) {
    return <div>{t('common.loading')}</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <LanguageProvider>
      <Routes>
        {/* 公共路由 */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/register" element={<Layout><Register /></Layout>} />
        
        {/* 状态页 - 无需认证 */}
        <Route path="/status" element={<StatusPage />} />
        
        {/* 受保护的路由 */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        
        {/* 状态页配置 - 需要认证 */}
        <Route path="/status/config" element={
          <ProtectedRoute>
            <Layout><StatusPageConfig /></Layout>
          </ProtectedRoute>
        } />
        
        {/* 通知配置 - 需要认证 */}
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Layout><NotificationsConfig /></Layout>
          </ProtectedRoute>
        } />
        
        {/* 监控路由 */}
        <Route path="/monitors" element={
          <ProtectedRoute>
            <Layout><MonitorsList /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/monitors/create" element={
          <ProtectedRoute>
            <Layout><CreateMonitor /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/monitors/edit/:id" element={
          <ProtectedRoute>
            <Layout><EditMonitor /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/monitors/:id" element={
          <ProtectedRoute>
            <Layout><MonitorDetail /></Layout>
          </ProtectedRoute>
        } />
        
        {/* 客户端路由 */}
        <Route path="/agents" element={
          <ProtectedRoute>
            <Layout><AgentsList /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/agents/create" element={
          <ProtectedRoute>
            <Layout><CreateAgent /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/agents/edit/:id" element={
          <ProtectedRoute>
            <Layout><EditAgent /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/agents/:id" element={
          <ProtectedRoute>
            <Layout><AgentDetail /></Layout>
          </ProtectedRoute>
        } />
        
        {/* 用户路由 */}
        <Route path="/users" element={
          <AdminRoute>
            <Layout><UsersList /></Layout>
          </AdminRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout><UserProfile /></Layout>
          </ProtectedRoute>
        } />
        
        {/* 404页面 */}
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </LanguageProvider>
  );
}

export default App;
