'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Payment = {
  id: string;
  user_id: string;
  amount: number;
  status: 'paid' | 'defaulted' | string;
  created_at: string;
};

type UserRow = {
  id: string;
  created_at: string;
};

export default function FinancialReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setErrorMsg('');

        const { data: paymentRows, error: payError } = await supabase
          .from('payments')
          .select('id,user_id,amount,status,created_at')
          .order('created_at', { ascending: false })
          .limit(1000);
        if (payError) {
          setErrorMsg('No payment data found or access denied.');
        }
        setPayments(paymentRows || []);

        const { data: userRows, error: userError } = await supabase
          .from('users')
          .select('id,created_at')
          .order('created_at', { ascending: false })
          .limit(2000);
        if (userError) {
          // still allow page to render
          console.warn('Users fetch error:', userError.message);
        }
        setUsers(userRows || []);
      } catch (err: any) {
        console.error('Error fetching reports data:', err);
        setErrorMsg('Unexpected error while loading reports.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const totalRevenue = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const paidUsers = new Set(payments.filter(p => p.status === 'paid').map(p => p.user_id));
    const defaultedUsers = new Set(payments.filter(p => p.status === 'defaulted').map(p => p.user_id));

    const activeMembers = paidUsers.size;
    const defaultedMembers = defaultedUsers.size;

    const buckets = Array.from({ length: 12 }, () => 0);
    const now = Date.now();
    users.forEach(u => {
      const created = new Date(u.created_at).getTime();
      const months = Math.floor((now - created) / (1000 * 60 * 60 * 24 * 30));
      const idx = Math.max(0, Math.min(11, months));
      buckets[idx] += 1;
    });

    return { totalRevenue, activeMembers, defaultedMembers, buckets };
  }, [payments, users]);

  const exportCsv = () => {
    const lines = [
      ['metric', 'value'],
      ['totalRevenue', metrics.totalRevenue],
      ['activeMembers', metrics.activeMembers],
      ['defaultedMembers', metrics.defaultedMembers],
    ];
    const csv = lines.map(l => l.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial_report.csv';
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
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <div className="flex items-center space-x-3">
          <button onClick={exportCsv} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">Export CSV</button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 text-yellow-800 p-3">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Revenue</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">${metrics.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Active Members</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{metrics.activeMembers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Defaulted Members</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{metrics.defaultedMembers}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">12-Month Countdown Status</h2>
        <div className="grid grid-cols-12 gap-2">
          {metrics.buckets.map((count, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-full h-24 bg-gray-200 rounded flex items-end">
                <div
                  className="w-full bg-blue-600 rounded"
                  style={{ height: `${Math.min(100, count * 10)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">M{idx + 1}</div>
              <div className="text-xs font-medium text-gray-900">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}