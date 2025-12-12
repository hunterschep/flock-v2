/**
 * GET /api/v1/usage
 * Get API usage statistics for the authenticated customer
 */

import { withApiAuth, apiSuccess, errors } from '@/lib/api';
import { getCustomerUsageStats, getCurrentPeriodUsage } from '@/lib/api/usage';
import { TIER_LIMITS } from '@/lib/api/types';

export const GET = withApiAuth(async ({ request, context }) => {
  const searchParams = new URL(request.url).searchParams;
  
  // Parse date range (default to last 30 days)
  const startDateParam = searchParams.get('start_date');
  const endDateParam = searchParams.get('end_date');
  
  const endDate = endDateParam ? new Date(endDateParam) : new Date();
  const startDate = startDateParam 
    ? new Date(startDateParam) 
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Validate dates
  if (isNaN(startDate.getTime())) {
    return errors.invalidParam('start_date', 'Invalid date format. Use ISO 8601 (YYYY-MM-DD)');
  }
  if (isNaN(endDate.getTime())) {
    return errors.invalidParam('end_date', 'Invalid date format. Use ISO 8601 (YYYY-MM-DD)');
  }
  
  try {
    // Get usage stats for the date range
    const stats = await getCustomerUsageStats(context.customerId, startDate, endDate);
    
    // Get current billing period usage
    const periodUsage = await getCurrentPeriodUsage(context.customerId);
    
    // Get tier limits
    const limits = TIER_LIMITS[context.tier];
    
    return apiSuccess({
      customer: {
        id: context.customerId,
        name: context.customerName,
        tier: context.tier,
      },
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      usage: {
        total_requests: stats.totalRequests,
        successful_requests: stats.successfulRequests,
        failed_requests: stats.failedRequests,
        avg_response_time_ms: stats.avgResponseTimeMs,
      },
      billing_period: {
        start: periodUsage.periodStart.toISOString().split('T')[0],
        end: periodUsage.periodEnd.toISOString().split('T')[0],
        total_requests: periodUsage.totalRequests,
        billable_units: periodUsage.billableUnits,
        monthly_limit: limits.monthlyRequestLimit,
        remaining: limits.monthlyRequestLimit === -1 
          ? null 
          : Math.max(0, limits.monthlyRequestLimit - periodUsage.billableUnits),
      },
      rate_limits: {
        per_minute: context.rateLimitPerMinute,
        per_day: context.rateLimitPerDay,
      },
      breakdown: {
        by_endpoint: stats.requestsByEndpoint,
        by_day: stats.requestsByDay,
      },
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return errors.internal('Failed to fetch usage statistics');
  }
});

