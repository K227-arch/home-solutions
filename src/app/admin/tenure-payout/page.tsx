'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

type UserRow = {
  id: string;
  email?: string | null;
  created_at: string;
};

type Winner = {
  user_id: string;
  email: string;
  prepaid: boolean;
};

export default function TenurePayoutManagement() {
  const [eligible, setEligible] = useState<UserRow[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchEligible = async () => {
      try {
        const { data: userRows } = await supabase
          .from('users')
          .select('id,created_at');

        const { data: usersList } = await supabase.auth.admin.listUsers();

        const now = Date.now();
        const eligibleUsers = (userRows || []).filter(u => {
          const months = Math.floor((now - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30));
          return months >= 12;
        }).map(u => ({
          ...u,
          email: usersList?.users.find(x => x.id === u.id)?.email || null,
        }));
        setEligible(eligibleUsers);
      } catch (err) {
        console.error('Error loading eligibility:', err);
      }
    };
    fetchEligible();
  }, []);

  const calculateWinners = async () => {
    try {
      setIsCalculating(true);
      setMessage('');

      const { data: paymentRows } = await supabase
        .from('payments')
        .select('user_id,amount,status')
        .eq('status', 'paid');

      const prepaidUsers = new Set(
        (paymentRows || [])
          .filter(p => Number(p.amount) >= 300)
          .map(p => p.user_id)
      );

      const eligibleWithPrepay = eligible.map(u => ({
        user_id: u.id,
        email: u.email || 'unknown',
        prepaid: prepaidUsers.has(u.id),
      }));

      // Simple selection: pick up to 3 prepaid winners
      const prepaid = eligibleWithPrepay.filter(e => e.prepaid);
      const shuffled = prepaid.sort(() => Math.random() - 0.5);
      setWinners(shuffled.slice(0, Math.min(3, shuffled.length)));
    } catch (err) {
      console.error('Error calculating winners:', err);
      setMessage('Unable to calculate winners at this time.');
      setWinners([]);
    } finally {
      setIsCalculating(false);
    }
  };

  const confirmPayouts = async () => {
    try {
      if (winners.length === 0) return;
      setMessage('');

      const inserts = winners.map(w => ({
        user_id: w.user_id,
        amount: 300,
        status: 'payout',
      }));
      const { error } = await supabase
        .from('payouts')
        .insert(inserts);
      if (error) throw error;

      await supabase.from('auth_audit_log').insert(
        winners.map(w => ({ action: 'payout', user_id: w.user_id, metadata: { amount: 300 } }))
      );

      setMessage('Payouts processed successfully.');
    } catch (err: any) {
      console.error('Error processing payouts:', err);
      setMessage('Failed to process payouts.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tenure & Payout Management</h1>
        <div className="flex items-center space-x-3">
          <Button onClick={calculateWinners} disabled={isCalculating} variant="default">
            {isCalculating ? 'Calculating…' : 'Calculate Payouts'}
          </Button>
          <Button onClick={confirmPayouts} disabled={winners.length === 0} variant="secondary">
            Confirm Payout Processing
          </Button>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded border border-blue-300 bg-blue-50 text-blue-800 p-3">
          {message}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Eligible Members (12+ months)</h2>
        <div className="text-sm text-gray-600 mb-2">Total eligible: {eligible.length}</div>
        <div className="max-h-64 overflow-auto border border-gray-200 rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {eligible.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{u.email || 'unknown'}</td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{u.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Winners</h2>
        {winners.length === 0 ? (
          <div className="text-gray-600">Run calculation to select winners.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">$300 Pre-payment</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {winners.map(w => (
                <tr key={w.user_id}>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{w.email}</td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{w.user_id}</td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${w.prepaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {w.prepaid ? 'Confirmed' : 'Missing'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}