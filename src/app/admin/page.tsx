'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    activeUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Get total users count
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        // Get new users today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: newUsersToday } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());
        
        // Get active users (logged in within last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { count: activeUsers } = await supabase
          .from('auth_audit_log')
          .select('user_id', { count: 'exact', head: true })
          .eq('action', 'login')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('user_id');
        
        setStats({
          totalUsers: totalUsers || 0,
          newUsersToday: newUsersToday || 0,
          activeUsers: activeUsers || 0,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Users</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">New Users Today</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.newUsersToday}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Active Users (7 days)</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="secondary">Export User Data</Button>
          <Button variant="secondary">View System Logs</Button>
        </div>
      </div>
    </div>
  );
}