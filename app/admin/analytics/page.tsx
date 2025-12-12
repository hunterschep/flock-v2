'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data - replace with actual API calls
  const requestsData = [
    { date: 'Dec 4', requests: 12400, errors: 45 },
    { date: 'Dec 5', requests: 14200, errors: 52 },
    { date: 'Dec 6', requests: 13800, errors: 38 },
    { date: 'Dec 7', requests: 15600, errors: 61 },
    { date: 'Dec 8', requests: 14900, errors: 42 },
    { date: 'Dec 9', requests: 16200, errors: 55 },
    { date: 'Dec 10', requests: 15420, errors: 48 },
  ];

  const maxRequests = Math.max(...requestsData.map(d => d.requests));

  const topCustomers = [
    { name: 'Stanford Analytics', requests: 45200, percentage: 35 },
    { name: 'Boston College', requests: 28100, percentage: 22 },
    { name: 'MIT Career Services', requests: 18500, percentage: 14 },
    { name: 'Harvard Research', requests: 15200, percentage: 12 },
    { name: 'Other', requests: 21900, percentage: 17 },
  ];

  const errorBreakdown = [
    { code: '401', label: 'Unauthorized', count: 142, percentage: 45 },
    { code: '429', label: 'Rate Limited', count: 98, percentage: 31 },
    { code: '404', label: 'Not Found', count: 52, percentage: 16 },
    { code: '500', label: 'Server Error', count: 24, percentage: 8 },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-white/50 text-sm">
            API usage and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-emerald-400">+8.2%</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">128.9K</div>
          <div className="text-xs text-white/50">Total Requests</div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-white/40">99.7%</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">128.6K</div>
          <div className="text-xs text-white/50">Successful</div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-xs text-red-400">316</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">0.25%</div>
          <div className="text-xs text-white/50">Error Rate</div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-white/40">P95: 285ms</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">142ms</div>
          <div className="text-xs text-white/50">Avg Response</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Requests Chart */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Requests Over Time</h2>
          <div className="h-64 flex items-end gap-2">
            {requestsData.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-[var(--color-accent)]/60 rounded-t hover:bg-[var(--color-accent)] transition-colors cursor-pointer"
                  style={{ height: `${(day.requests / maxRequests) * 100}%` }}
                  title={`${day.requests.toLocaleString()} requests`}
                />
                <span className="text-xs text-white/40">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Breakdown */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Error Breakdown</h2>
          <div className="space-y-4">
            {errorBreakdown.map((error) => (
              <div key={error.code} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-white">{error.code}</span>
                    <span className="text-xs text-white/40">{error.label}</span>
                  </div>
                  <span className="text-xs text-white/50">{error.count}</span>
                </div>
                <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      error.code === '401' ? 'bg-amber-500/60' :
                      error.code === '429' ? 'bg-blue-500/60' :
                      error.code === '404' ? 'bg-violet-500/60' :
                      'bg-red-500/60'
                    }`}
                    style={{ width: `${error.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Top Customers by Usage</h2>
        <div className="space-y-4">
          {topCustomers.map((customer, idx) => (
            <div key={customer.name} className="flex items-center gap-4">
              <span className="text-sm text-white/40 w-6">{idx + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white">{customer.name}</span>
                  <span className="text-xs text-white/50">{customer.requests.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-full"
                    style={{ width: `${customer.percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-white/40 w-12 text-right">{customer.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

