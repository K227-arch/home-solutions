'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  User as UserIcon,
  CreditCard,
  ListOrdered,
  LineChart,
  History as HistoryIcon,
  Bell,
  Settings as SettingsIcon,
  LifeBuoy,
  Crown,
  Calendar,
  DollarSign,
  Users,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCounterAnimation } from '@/hooks/use-counter-animation';
import { createClient } from '@supabase/supabase-js';

export default function Dashboard() {
  const [user, setUser] = useState<{ user_metadata?: { full_name?: string }; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Animated counters
  const daysUntilPayment = useCounterAnimation(15, 1200, 100);
  const totalRevenue = useCounterAnimation(250000, 1500, 200);
  const potentialWinners = useCounterAnimation(2, 800, 300);
  const daysUntilDraw = useCounterAnimation(45, 1000, 250);
  const paymentAmount = useCounterAnimation(25, 800, 150);

  // Mock data aligned to design
  const userData = {
    memberId: 'TRP-2024-001',
    tenureStart: 'January 1, 2025',
    nextPaymentDue: 'February 1, 2025',
    nextDrawDate: 'March 15, 2025',
  };

  const queueData = [
    { rank: 1, name: 'Alice Johnson', tenureMonths: 24, status: 'Active' },
    { rank: 2, name: 'Bob Smith', tenureMonths: 22, status: 'Active' },
    { rank: 3, name: 'John Doe', tenureMonths: 18, status: 'Active', isCurrentUser: true },
  ];

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
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    await supabase.auth.signOut();
    router.push('/login');
  };

  const userDisplayName = useMemo(() => {
    return (
      user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'
    );
  }, [user]);

  const currentUserRank = useMemo(() => {
    const me = queueData.find((m) => m.isCurrentUser);
    return me?.rank || 3;
  }, [queueData]);

  const fundTarget = 500_000;
  const fundRemaining = Math.max(0, fundTarget - totalRevenue.count);
  const fundProgressPct = Math.min(100, Math.round((totalRevenue.count / fundTarget) * 100));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Crown className="w-12 h-12 text-accent animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card/70 backdrop-blur-sm flex flex-col justify-between">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="w-6 h-6 text-accent" />
            <span className="text-lg font-bold">Tenure</span>
          </div>
          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 bg-primary/10 text-foreground">
              <LayoutDashboard className="w-4 h-4 text-primary" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link href="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/10">
              <UserIcon className="w-4 h-4" />
              <span>Profile</span>
            </Link>
            <Link href="/transactions" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/10">
              <CreditCard className="w-4 h-4" />
              <span>Transactions</span>
            </Link>
            <Link href="/queue" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/10">
              <ListOrdered className="w-4 h-4" />
              <span>Tenure Queue</span>
              <Badge className="ml-auto" variant="secondary">LIVE</Badge>
            </Link>
            <Link href="/analytics" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/10">
              <LineChart className="w-4 h-4" />
              <span>Analytics</span>
            </Link>
            <Link href="/history" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/10">
              <HistoryIcon className="w-4 h-4" />
              <span>History</span>
            </Link>
            <Link href="/notifications" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/10">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </Link>
            <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/10">
              <SettingsIcon className="w-4 h-4" />
              <span>Settings</span>
            </Link>
            <Link href="/support" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/10">
              <LifeBuoy className="w-4 h-4" />
              <span>Help & Support</span>
            </Link>
          </nav>
        </div>
        <div className="px-4 py-4 border-t">
          <Card className="p-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-muted/20 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: 'hsl(var(--success))' }} />
              </div>
              <div>
                <p className="text-sm font-medium">{userDisplayName}</p>
                <p className="text-xs text-muted-foreground">{userData.memberId}</p>
              </div>
            </div>
          </Card>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 px-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {userDisplayName}</p>
              <p className="text-xs text-muted-foreground">Member ID: {userData.memberId}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleSignOut}>Sign Out</Button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-secondary p-2">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Days until Payment</p>
                  <p className="text-xl font-bold" ref={daysUntilPayment.ref}>{daysUntilPayment.count}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-secondary p-2">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Queue Position</p>
                  <p className="text-xl font-bold">#{currentUserRank}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-secondary p-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Fund</p>
                  <p className="text-xl font-bold" ref={totalRevenue.ref}>${totalRevenue.count.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-secondary p-2">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next Draw</p>
                  <p className="text-xl font-bold" ref={daysUntilDraw.ref}>{daysUntilDraw.count} days</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Fund Progress */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">Fund Progress</Badge>
            </div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{fundProgressPct}% complete</p>
              <p className="text-sm text-muted-foreground">${totalRevenue.count.toLocaleString()} / ${fundTarget.toLocaleString()}</p>
            </div>
            <Progress value={fundProgressPct} />
            <p className="text-xs text-muted-foreground mt-2">Need ${fundRemaining.toLocaleString()} more for next draw</p>
          </Card>

          {/* Your Queue Status */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-semibold">Your Queue Status</h2>
            </div>
            <ul className="space-y-3">
              {queueData.map((m) => (
                <li key={m.rank} className={`flex items-center justify-between rounded-lg border p-3 ${m.isCurrentUser ? 'bg-primary/5 border-primary/40' : 'bg-card'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${m.isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>{m.rank}</div>
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.tenureMonths} months</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{m.status}</div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Bottom cards: Next Payment & Next Draw */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <p className="text-xs text-muted-foreground">Due: {userData.nextPaymentDue}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-2xl font-bold">${paymentAmount.count.toFixed(2)}</p>
                <Button className="rounded-lg">Make Payment</Button>
              </div>
            </Card>
            <Card className="p-6">
              <p className="text-xs text-muted-foreground">Date: {userData.nextDrawDate}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-2xl font-bold" ref={potentialWinners.ref}>{potentialWinners.count} winners</p>
                <Button variant="outline" className="rounded-lg">View Details</Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
