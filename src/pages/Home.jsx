import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return isAdmin ? <AdminDashboard /> : <UserDashboard />;
}