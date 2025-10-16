'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/logger';

const logger = createLogger('dashboard-page');

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUser(session.user);
          logger.info('User authenticated', { userId: session.user.id });
        }
      } catch (error) {
        logger.error('Error fetching user data', { error });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-high-contrast">Dashboard</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {user ? (
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white">
              <h2 className="text-2xl font-semibold mb-4 text-high-contrast">Welcome to your dashboard</h2>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2 text-high-contrast">Your Profile</h3>
                <p className="text-readable mb-1">
                  <span className="font-medium text-high-contrast">Email:</span> {user.email}
                </p>
                <p className="text-readable mb-1">
                  <span className="font-medium text-high-contrast">User ID:</span> {user.id}
                </p>
                <p className="text-readable mb-1">
                  <span className="font-medium text-high-contrast">Last Sign In:</span>{' '}
                  {new Date(user.last_sign_in_at).toLocaleString()}
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2 text-high-contrast">Actions</h3>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white">
              <h2 className="text-2xl font-semibold mb-4 text-high-contrast">Not signed in</h2>
              <p className="text-readable mb-4">
                Please sign in to view your dashboard.
              </p>
              <a
                href="/login"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}