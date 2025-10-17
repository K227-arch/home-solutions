'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

type AuditLog = {
  id: string;
  created_at: string;
  user_id: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
  user_email?: string;
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      
      // Build query
      let query = supabase
        .from('auth_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      // Apply filter
      if (filter !== 'all') {
        query = query.eq('action', filter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Get user emails for user IDs
      const userIds = [...new Set(data.map(log => log.user_id))];
      const { data: users } = await supabase.auth.admin.listUsers();
      
      // Combine data
      const logsWithUserInfo = data.map(log => {
        const user = users?.users.find(u => u.id === log.user_id);
        return {
          ...log,
          user_email: user?.email || 'Unknown',
        };
      });
      
      setLogs(logsWithUserInfo);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'login': return 'Login';
      case 'logout': return 'Logout';
      case 'signup': return 'Sign Up';
      case 'user_deleted': return 'User Deleted';
      case 'role_updated': return 'Role Updated';
      default: return action;
    }
  };

  const displayLogs = logs.filter(l => {
    const q = query.toLowerCase();
    if (!q) return true;
    return (
      (l.user_email || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q)
    );
  });

  const exportCsv = () => {
    const rows = displayLogs.map(l => ({
      timestamp: l.created_at,
      user: l.user_email,
      action: l.action,
      ip: l.ip_address || '',
      details: l.metadata ? JSON.stringify(l.metadata) : '',
    }));
    const headers = Object.keys(rows[0] || { timestamp: '', user: '', action: '', ip: '', details: '' });
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h as keyof typeof r] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search user or action"
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="signup">Sign Up</option>
            <option value="user_deleted">User Deleted</option>
            <option value="role_updated">Role Updated</option>
          </select>
          <Button
            onClick={fetchLogs}
            className="px-4"
          >
            Refresh
          </Button>
          <Button
            onClick={exportCsv}
            variant="outline"
            size="sm"
          >
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayLogs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {log.user_email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    log.action === 'login' ? 'bg-green-100 text-green-800' :
                    log.action === 'logout' ? 'bg-blue-100 text-blue-800' :
                    log.action === 'signup' ? 'bg-purple-100 text-purple-800' :
                    log.action === 'user_deleted' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getActionLabel(log.action)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.ip_address || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.metadata ? JSON.stringify(log.metadata) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}