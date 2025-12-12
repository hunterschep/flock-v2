'use client';

import { useEffect, useState } from 'react';
import { Users, Key, Activity, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalApiKeys: number;
  activeApiKeys: number;
  requestsToday: number;
  requestsYesterday: number;
  avgResponseTime: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // These would be real queries in production
      // For now, show placeholder stats
      setStats({
        totalCustomers: 12,
        activeCustomers: 10,
        totalApiKeys: 28,
        activeApiKeys: 24,
        requestsToday: 15420,
        requestsYesterday: 14890,
        avgResponseTime: 142,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestChange = stats 
    ? ((stats.requestsToday - stats.requestsYesterday) / stats.requestsYesterday * 100).toFixed(1)
    : '0';
  const isPositive = Number(requestChange) >= 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">API Dashboard</h1>
        <p className="text-white/50 text-sm">
          Monitor your API usage and manage customers
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Customers */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs text-white/40">Customers</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {loading ? '—' : stats?.totalCustomers}
          </div>
          <div className="text-xs text-white/50">
            {loading ? '—' : `${stats?.activeCustomers} active`}
          </div>
        </div>

        {/* API Keys */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-xs text-white/40">API Keys</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {loading ? '—' : stats?.totalApiKeys}
          </div>
          <div className="text-xs text-white/50">
            {loading ? '—' : `${stats?.activeApiKeys} active`}
          </div>
        </div>

        {/* Requests Today */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs text-white/40">Today</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {loading ? '—' : stats?.requestsToday.toLocaleString()}
          </div>
          <div className={`text-xs flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {requestChange}% vs yesterday
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xs text-white/40">Avg Response</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {loading ? '—' : `${stats?.avgResponseTime}ms`}
          </div>
          <div className="text-xs text-white/50">
            P95: ~280ms
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { action: 'API key created', customer: 'Boston College', time: '2 min ago' },
              { action: 'Rate limit hit', customer: 'Stanford Analytics', time: '15 min ago' },
              { action: 'New customer', customer: 'MIT Career Services', time: '1 hour ago' },
              { action: 'Subscription upgraded', customer: 'Harvard Research', time: '3 hours ago' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
                <div>
                  <div className="text-sm text-white">{item.action}</div>
                  <div className="text-xs text-white/40">{item.customer}</div>
                </div>
                <div className="text-xs text-white/30">{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Endpoints */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Endpoints (24h)</h2>
          <div className="space-y-3">
            {[
              { endpoint: '/v1/institutions/:id/locations', requests: 8420, percentage: 55 },
              { endpoint: '/v1/institutions/:id/employment', requests: 4210, percentage: 27 },
              { endpoint: '/v1/institutions', requests: 1890, percentage: 12 },
              { endpoint: '/v1/institutions/:id/grad-schools', requests: 900, percentage: 6 },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <code className="text-xs text-white/70 font-mono">{item.endpoint}</code>
                  <span className="text-xs text-white/50">{item.requests.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--color-accent)]/60 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

