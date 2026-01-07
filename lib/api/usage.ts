/**
 * API Usage Logging
 * Tracks API usage for analytics and billing
 */

import { getServiceClient } from './supabase';

export interface UsageLogParams {
  apiKeyId?: string;
  customerId?: string;
  endpoint: string;
  method: string;
  path: string;
  queryParams?: Record<string, unknown>;
  statusCode: number;
  responseTimeMs: number;
  responseSizeBytes?: number;
  errorCode?: string;
  errorMessage?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  billableUnits?: number;
}

/**
 * Log an API request (fire and forget - truly non-blocking)
 * Returns immediately without awaiting the database call
 */
export function logApiUsage(params: UsageLogParams): void {
  // Skip logging if no customer (e.g., failed auth)
  if (!params.customerId) {
    return;
  }

  // Fire and forget - don't await, just schedule the promise
  getServiceClient().rpc('log_api_usage', {
    p_api_key_id: params.apiKeyId || null,
    p_customer_id: params.customerId,
    p_endpoint: params.endpoint,
    p_method: params.method,
    p_path: params.path,
    p_query_params: params.queryParams || null,
    p_status_code: params.statusCode,
    p_response_time_ms: params.responseTimeMs,
    p_response_size_bytes: params.responseSizeBytes || null,
    p_error_code: params.errorCode || null,
    p_error_message: params.errorMessage || null,
    p_ip_address: params.ipAddress || null,
    p_user_agent: params.userAgent || null,
    p_billable_units: params.billableUnits || 1,
  }).then(({ error }) => {
    if (error) {
      // Log error but don't throw - usage logging should never break the API
      console.error('Failed to log API usage:', error);
    }
  });
}

/**
 * Get usage statistics for a customer
 */
export async function getCustomerUsageStats(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTimeMs: number;
  requestsByEndpoint: Record<string, number>;
  requestsByDay: { date: string; count: number }[];
}> {
  const { data, error } = await getServiceClient()
    .from('api_usage')
    .select('*')
    .eq('customer_id', customerId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch usage stats: ${error.message}`);
  }

  const requests = data || [];
  const totalRequests = requests.length;
  const successfulRequests = requests.filter(r => r.status_code >= 200 && r.status_code < 300).length;
  const failedRequests = requests.filter(r => r.status_code >= 400).length;
  const avgResponseTimeMs = requests.length > 0
    ? Math.round(requests.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / requests.length)
    : 0;

  // Group by endpoint
  const requestsByEndpoint: Record<string, number> = {};
  requests.forEach(r => {
    requestsByEndpoint[r.endpoint] = (requestsByEndpoint[r.endpoint] || 0) + 1;
  });

  // Group by day
  const requestsByDayMap: Record<string, number> = {};
  requests.forEach(r => {
    const date = r.created_at.split('T')[0];
    requestsByDayMap[date] = (requestsByDayMap[date] || 0) + 1;
  });
  const requestsByDay = Object.entries(requestsByDayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    avgResponseTimeMs,
    requestsByEndpoint,
    requestsByDay,
  };
}

/**
 * Get usage for the current billing period
 */
export async function getCurrentPeriodUsage(customerId: string): Promise<{
  totalRequests: number;
  billableUnits: number;
  periodStart: Date;
  periodEnd: Date;
}> {
  // Get customer's billing period
  const { data: customer, error: customerError } = await getServiceClient()
    .from('api_customers')
    .select('current_period_start, current_period_end')
    .eq('id', customerId)
    .single();

  if (customerError || !customer) {
    throw new Error('Customer not found');
  }

  const periodStart = customer.current_period_start
    ? new Date(customer.current_period_start)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // Default to start of month
  
  const periodEnd = customer.current_period_end
    ? new Date(customer.current_period_end)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0); // Default to end of month

  // Get usage for the period
  const { data, error } = await getServiceClient()
    .from('api_usage')
    .select('billable_units')
    .eq('customer_id', customerId)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  if (error) {
    throw new Error(`Failed to fetch period usage: ${error.message}`);
  }

  const requests = data || [];
  const totalRequests = requests.length;
  const billableUnits = requests.reduce((sum, r) => sum + (r.billable_units || 1), 0);

  return {
    totalRequests,
    billableUnits,
    periodStart,
    periodEnd,
  };
}

