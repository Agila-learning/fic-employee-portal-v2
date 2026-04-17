import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import BirthdayBanner from '../dashboard/BirthdayBanner';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'employee';
}

const DashboardLayout = ({ children, requiredRole }: DashboardLayoutProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin, Sub-Admin and MD can access admin pages
  if (requiredRole === 'admin' && user.role !== 'admin' && user.role !== 'md' && user.role !== 'sub-admin') {
    return <Navigate to="/employee" replace />;
  }

  // Strictly block Sub-Admin from specific admin sections
  if (user.role === 'sub-admin') {
    const restrictedPaths = ['/admin/employees', '/admin/expenses'];
    if (restrictedPaths.some(path => location.pathname.startsWith(path))) {
      return <Navigate to="/admin" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col scroll-smooth transition-colors duration-300">
      <Sidebar />
      <main className="ml-0 md:ml-64 flex-1 px-3 py-4 sm:p-6 pb-8 pt-16 md:pt-6">
        <div className="animate-fade-in max-w-7xl mx-auto w-full">
          <BirthdayBanner />
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardLayout;