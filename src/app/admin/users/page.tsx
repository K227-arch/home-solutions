'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';

type User = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [activityFilter, setActivityFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortKey, setSortKey] = useState<'email' | 'created' | 'lastLogin'>('created');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get users from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;
      
      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;
      
      // Combine data
      const combinedUsers = authUsers.users.map(user => {
        const roleData = userRoles?.find(r => r.user_id === user.id);
        return {
          id: user.id,
          email: user.email || '',
          role: roleData?.role || 'user',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
        };
      });
      
      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      // Delete user from auth
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;
      
      // Update UI
      setUsers(users.filter(user => user.id !== userId));
      
      // Log action
      await supabase.from('auth_audit_log').insert({
        action: 'user_deleted',
        user_id: userId,
        performed_by: (await supabase.auth.getUser()).data.user?.id,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      // Update role in database
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole });
      
      if (error) throw error;
      
      // Update UI
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      // Close modal
      setIsEditModalOpen(false);
      setSelectedUser(null);
      
      // Log action
      await supabase.from('auth_audit_log').insert({
        action: 'role_updated',
        user_id: userId,
        performed_by: (await supabase.auth.getUser()).data.user?.id,
        metadata: { new_role: newRole },
      });
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role. Please try again.');
    }
  };

  const handleViewHistory = async (user: User) => {
    try {
      setSelectedUser(user);
      setIsHistoryModalOpen(true);
      // Fetch audit log history for the user
      const { data, error } = await supabase
        .from('auth_audit_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setUserHistory(data || []);
    } catch (err) {
      console.error('Error fetching user history:', err);
      setUserHistory([]);
    }
  };

  const exportCsv = () => {
    const rows = filteredUsers.map(u => ({
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at || '',
    }));
    const headers = Object.keys(rows[0] || { email: '', role: '', created_at: '', last_sign_in_at: '' });
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h as keyof typeof r] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users
    .filter(u => (roleFilter === 'all' ? true : u.role === roleFilter))
    .filter(u => {
      if (activityFilter === 'all') return true;
      const isActive = !!u.last_sign_in_at;
      return activityFilter === 'active' ? isActive : !isActive;
    })
    .filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'email') return a.email.localeCompare(b.email) * dir;
      if (sortKey === 'created') return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      const aLogin = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
      const bLogin = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
      return (aLogin - bLogin) * dir;
    });

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
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex items-center space-x-3">
          <Button onClick={fetchUsers}>Refresh</Button>
          <button onClick={exportCsv} className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">Export CSV</button>
        </div>
      </div>
      <div className="bg-white shadow-md rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email"
            className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Activity</option>
            <option value="active">Active (has login)</option>
            <option value="inactive">Inactive (never logged in)</option>
          </select>
          <div className="flex space-x-2">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created">Sort by Created</option>
              <option value="lastLogin">Sort by Last Login</option>
              <option value="email">Sort by Email</option>
            </select>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).toLocaleDateString() 
                    : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleEditUser(user)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleViewHistory(user)}
                    className="text-gray-700 hover:text-gray-900 mr-4"
                  >
                    History
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{selectedUser.email}</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                defaultValue={selectedUser.role}
                onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateRole(selectedUser.id, selectedUser.role)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User History Modal */}
      {isHistoryModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Membership History</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-600 hover:text-gray-800">Close</button>
            </div>
            <p className="text-sm text-gray-600 mb-2">{selectedUser.email}</p>
            <div className="max-h-96 overflow-auto border border-gray-200 rounded">
              {userHistory.length === 0 ? (
                <div className="p-4 text-gray-500">No history available.</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userHistory.map((h) => (
                    <li key={h.id} className="p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{String(h.action)}</span>
                        <span className="text-gray-500">{new Date(h.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-gray-600 mt-1">{h.metadata ? JSON.stringify(h.metadata) : '—'}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}