import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/constants/admin';

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return isAdminEmail(user?.email);
}

export async function GET(_request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role client to bypass RLS on api_customers/api_keys/api_usage tables
  const supabase = createServiceRoleClient();

  try {
    // Get customer counts
    const { count: totalCustomers } = await supabase
      .from('api_customers')
      .select('*', { count: 'exact', head: true });

    const { count: activeCustomers } = await supabase
      .from('api_customers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get API key counts
    const { count: totalApiKeys } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true });

    const { count: activeApiKeys } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get today's requests
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: todayUsage } = await supabase
      .from('api_usage')
      .select('response_time_ms')
      .gte('created_at', today.toISOString());

    const { count: requestsYesterday } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    const requestsToday = todayUsage?.length || 0;
    const avgResponseTime = todayUsage && todayUsage.length > 0
      ? Math.round(todayUsage.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / todayUsage.length)
      : 0;

    // Get recent activity (last 10 events)
    const { data: recentKeys } = await supabase
      .from('api_keys')
      .select(`
        created_at,
        name,
        api_customers (name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recentErrors } = await supabase
      .from('api_usage')
      .select(`
        created_at,
        status_code,
        error_code,
        customer_id,
        api_customers (name)
      `)
      .gte('status_code', 400)
      .order('created_at', { ascending: false })
      .limit(5);

    // Helper to extract customer name from join result
    const getCustomerName = (apiCustomers: unknown): string => {
      if (!apiCustomers) return 'Unknown';
      // Handle both array and object cases from Supabase joins
      if (Array.isArray(apiCustomers)) {
        return (apiCustomers[0] as { name?: string })?.name || 'Unknown';
      }
      return (apiCustomers as { name?: string })?.name || 'Unknown';
    };

    // Format recent activity
    const recentActivity = [
      ...(recentKeys || []).map(k => ({
        action: 'API key created',
        customer: getCustomerName(k.api_customers),
        time: k.created_at,
      })),
      ...(recentErrors || []).map(e => ({
        action: e.status_code === 429 ? 'Rate limit hit' : `Error ${e.status_code}`,
        customer: getCustomerName(e.api_customers),
        time: e.created_at,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5)
      .map(item => ({
        ...item,
        time: formatRelativeTime(new Date(item.time)),
      }));

    // Get top endpoints (last 24 hours)
    const { data: usageByEndpoint } = await supabase
      .from('api_usage')
      .select('endpoint')
      .gte('created_at', yesterday.toISOString());

    const endpointCounts: Record<string, number> = {};
    (usageByEndpoint || []).forEach(u => {
      endpointCounts[u.endpoint] = (endpointCounts[u.endpoint] || 0) + 1;
    });

    const totalEndpointRequests = Object.values(endpointCounts).reduce((a, b) => a + b, 0);
    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([endpoint, requests]) => ({
        endpoint,
        requests,
        percentage: totalEndpointRequests > 0 ? Math.round((requests / totalEndpointRequests) * 100) : 0,
      }));

    return NextResponse.json({
      stats: {
        totalCustomers: totalCustomers || 0,
        activeCustomers: activeCustomers || 0,
        totalApiKeys: totalApiKeys || 0,
        activeApiKeys: activeApiKeys || 0,
        requestsToday,
        requestsYesterday: requestsYesterday || 0,
        avgResponseTime,
      },
      recentActivity,
      topEndpoints,
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    return NextResponse.json({
      stats: {
        totalCustomers: 0,
        activeCustomers: 0,
        totalApiKeys: 0,
        activeApiKeys: 0,
        requestsToday: 0,
        requestsYesterday: 0,
        avgResponseTime: 0,
      },
      recentActivity: [],
      topEndpoints: [],
    });
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

