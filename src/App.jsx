import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import AppLayout from '@/components/layout/AppLayout';
import AdminRoute from '@/components/AdminRoute';
import Home from '@/pages/Home';
import CourseManagement from '@/pages/CourseManagement';
import RoadmapBuilder from '@/pages/RoadmapBuilder';
import AdminProgress from '@/pages/AdminProgress';
import BrowseCourses from '@/pages/BrowseCourses';
import MyCourses from '@/pages/MyCourses';
import Tracker from '@/pages/Tracker';
import RoadmapView from '@/pages/RoadmapView';
import Revision from '@/pages/Revision';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<AdminRoute><CourseManagement /></AdminRoute>} />
          <Route path="/roadmap-builder/:courseId" element={<AdminRoute><RoadmapBuilder /></AdminRoute>} />
          <Route path="/admin/progress" element={<AdminRoute><AdminProgress /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><Home /></AdminRoute>} />
          <Route path="/browse-courses" element={<BrowseCourses />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/roadmap" element={<RoadmapView />} />
          <Route path="/revision" element={<Revision />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App