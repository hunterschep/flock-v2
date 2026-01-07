'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  BarChart3, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AnalyticsData {
  stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    errorRate: string;
    avgResponseTime: number;
  };
  requestsData: { date: string; requests: number; errors: number }[];
  errorBreakdown: { code: string; label: string; count: number; percentage: number }[];
  topCustomers: { name: string; requests: number; percentage: number }[];
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const maxRequests = data?.requestsData?.length 
    ? Math.max(...data.requestsData.map(d => d.requests), 1)
    : 1;

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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--color-accent)] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {(data?.stats.totalRequests || 0).toLocaleString()}
              </div>
              <div className="text-xs text-white/50">Total Requests</div>
            </div>

            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-white/40">
                  {data?.stats.totalRequests ? 
                    ((data.stats.successfulRequests / data.stats.totalRequests) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {(data?.stats.successfulRequests || 0).toLocaleString()}
              </div>
              <div className="text-xs text-white/50">Successful</div>
            </div>

            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-xs text-red-400">{data?.stats.failedRequests || 0}</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{data?.stats.errorRate || 0}%</div>
              <div className="text-xs text-white/50">Error Rate</div>
            </div>

            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{data?.stats.avgResponseTime || 0}ms</div>
              <div className="text-xs text-white/50">Avg Response</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Requests Chart */}
            <div className="lg:col-span-2 glass-card rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Requests Over Time</h2>
              {data?.requestsData && data.requestsData.length > 0 ? (
                <div className="h-64 flex items-end gap-2">
                  {data.requestsData.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-[var(--color-accent)]/60 rounded-t hover:bg-[var(--color-accent)] transition-colors cursor-pointer"
                        style={{ height: `${(day.requests / maxRequests) * 100}%`, minHeight: day.requests > 0 ? '4px' : '0' }}
                        title={`${day.requests.toLocaleString()} requests`}
                      />
                      <span className="text-xs text-white/40">{day.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-white/40 text-sm">
                  No request data available for this period
                </div>
              )}
            </div>

            {/* Error Breakdown */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Error Breakdown</h2>
              {data?.errorBreakdown && data.errorBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {data.errorBreakdown.map((error) => (
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
              ) : (
                <div className="flex items-center justify-center h-40 text-white/40 text-sm">
                  No errors in this period 🎉
                </div>
              )}
            </div>
          </div>

          {/* Top Customers */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Top Customers by Usage</h2>
            {data?.topCustomers && data.topCustomers.length > 0 ? (
              <div className="space-y-4">
                {data.topCustomers.map((customer, idx) => (
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
            ) : (
              <div className="flex items-center justify-center py-12 text-white/40 text-sm">
                No customer usage data available yet
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
