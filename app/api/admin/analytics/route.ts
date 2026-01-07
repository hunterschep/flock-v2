import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Admin emails that can view analytics
const ADMIN_EMAILS = [
  'scheppat@bc.edu',
  'hunterschep@gmail.com',
];

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}

export async function GET(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '7d';

  const supabase = await createClient();

  // Calculate date range
  let daysAgo = 7;
  if (range === '24h') daysAgo = 1;
  else if (range === '30d') daysAgo = 30;
  else if (range === '90d') daysAgo = 90;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  try {
    // Get total requests in range
    const { data: usageData, error: usageError } = await supabase
      .from('api_usage')
      .select('status_code, response_time_ms, created_at, api_key_id, customer_id')
      .gte('created_at', startDate.toISOString());

    if (usageError) {
      console.error('Error fetching usage data:', usageError);
    }

    const usage = usageData || [];
    const totalRequests = usage.length;
    const successfulRequests = usage.filter(u => u.status_code >= 200 && u.status_code < 400).length;
    const failedRequests = totalRequests - successfulRequests;
    const avgResponseTime = usage.length > 0 
      ? Math.round(usage.reduce((sum, u) => sum + (u.response_time_ms || 0), 0) / usage.length)
      : 0;

    // Group by date for chart
    const requestsByDate: Record<string, { requests: number; errors: number }> = {};
    usage.forEach(u => {
      const date = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!requestsByDate[date]) {
        requestsByDate[date] = { requests: 0, errors: 0 };
      }
      requestsByDate[date].requests++;
      if (u.status_code >= 400) {
        requestsByDate[date].errors++;
      }
    });

    const requestsData = Object.entries(requestsByDate)
      .map(([date, data]) => ({ date, ...data }))
      .slice(-7); // Last 7 data points

    // Get error breakdown
    const errorCounts: Record<string, number> = {};
    usage.filter(u => u.status_code >= 400).forEach(u => {
      const code = u.status_code.toString();
      errorCounts[code] = (errorCounts[code] || 0) + 1;
    });

    const errorBreakdown = Object.entries(errorCounts)
      .map(([code, count]) => ({
        code,
        label: getErrorLabel(parseInt(code)),
        count,
        percentage: totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Get top customers by usage
    const customerCounts: Record<string, number> = {};
    usage.forEach(u => {
      if (u.customer_id) {
        customerCounts[u.customer_id] = (customerCounts[u.customer_id] || 0) + 1;
      }
    });

    // Get customer names
    const customerIds = Object.keys(customerCounts);
    let topCustomers: { name: string; requests: number; percentage: number }[] = [];

    if (customerIds.length > 0) {
      const { data: customers } = await supabase
        .from('api_customers')
        .select('id, name')
        .in('id', customerIds);

      const customerNameMap: Record<string, string> = {};
      customers?.forEach(c => {
        customerNameMap[c.id] = c.name;
      });

      topCustomers = Object.entries(customerCounts)
        .map(([id, requests]) => ({
          name: customerNameMap[id] || 'Unknown',
          requests,
          percentage: totalRequests > 0 ? Math.round((requests / totalRequests) * 100) : 0,
        }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 5);
    }

    return NextResponse.json({
      stats: {
        totalRequests,
        successfulRequests,
        failedRequests,
        errorRate: totalRequests > 0 ? ((failedRequests / totalRequests) * 100).toFixed(2) : '0',
        avgResponseTime,
      },
      requestsData,
      errorBreakdown,
      topCustomers,
    });
  } catch (error) {
    console.error('Error in analytics:', error);
    return NextResponse.json({ 
      stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, errorRate: '0', avgResponseTime: 0 },
      requestsData: [],
      errorBreakdown: [],
      topCustomers: [],
    });
  }
}

function getErrorLabel(code: number): string {
  switch (code) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 429: return 'Rate Limited';
    case 500: return 'Server Error';
    default: return `Error ${code}`;
  }
}

