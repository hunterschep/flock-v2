/**
 * Flock API Types
 * Core type definitions for the institutional API
 */

// ============================================
// API Key & Customer Types
// ============================================

export type ApiTier = 'starter' | 'pro' | 'enterprise';
export type ApiCustomerStatus = 'active' | 'suspended' | 'cancelled' | 'pending';
export type ApiKeyEnvironment = 'production' | 'development' | 'test';

export interface ApiCustomer {
  id: string;
  name: string;
  slug: string;
  contact_name: string;
  contact_email: string;
  billing_email: string | null;
  tier: ApiTier;
  status: ApiCustomerStatus;
  allowed_institution_ids: string[];
  custom_rate_limit_per_minute: number | null;
  custom_rate_limit_per_day: number | null;
  custom_monthly_request_limit: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  customer_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  description: string | null;
  scopes: string[];
  rate_limit_per_minute: number | null;
  rate_limit_per_day: number | null;
  environment: ApiKeyEnvironment;
  is_active: boolean;
  last_used_at: string | null;
  usage_count: number;
  expires_at: string | null;
  allowed_ips: string[] | null;
  created_at: string;
  revoked_at: string | null;
}

// ============================================
// Validated API Context
// ============================================

export interface ApiContext {
  keyId: string;
  customerId: string;
  customerName: string;
  customerSlug: string;
  tier: ApiTier;
  scopes: string[];
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  allowedInstitutionIds: string[];
}

// ============================================
// Rate Limiting
// ============================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  request_id: string;
  timestamp: string;
  rate_limit?: {
    limit: number;
    remaining: number;
    reset: string;
  };
}

// ============================================
// Aggregated Data Types
// ============================================

export interface LocationDistribution {
  location: string;
  count: number;
  percentage: number;
}

export interface EmployerData {
  name: string;
  count: number;
}

export interface StatusDistribution {
  employed: { count: number; percentage: number };
  grad_school: { count: number; percentage: number };
  internship: { count: number; percentage: number };
  looking: { count: number; percentage: number };
  other: { count: number; percentage: number };
}

export interface InstitutionSummary {
  id: string;
  name: string;
  domain: string;
  total_alumni: number;
}

export interface LocationsResponse {
  institution: InstitutionSummary;
  filters: {
    granularity: 'city' | 'state' | 'country';
    grad_years?: [number, number];
  };
  total_alumni: number;
  distribution: LocationDistribution[];
  generated_at: string;
}

export interface EmploymentResponse {
  institution: InstitutionSummary;
  filters: {
    grad_years?: [number, number];
  };
  total_alumni: number;
  status_breakdown: StatusDistribution;
  top_employers: EmployerData[];
  top_job_titles: EmployerData[];
  generated_at: string;
}

export interface GradSchoolsResponse {
  institution: InstitutionSummary;
  filters: {
    grad_years?: [number, number];
  };
  total_in_grad_school: number;
  top_schools: EmployerData[];
  degree_breakdown: Record<string, { count: number; percentage: number }>;
  generated_at: string;
}

export interface TrendDataPoint {
  period: string;
  count: number;
  percentage?: number;
}

export interface TrendsResponse {
  institution: InstitutionSummary;
  metric: string;
  filters: Record<string, unknown>;
  data_points: TrendDataPoint[];
  generated_at: string;
}

// ============================================
// API Error Codes
// ============================================

export const API_ERROR_CODES = {
  // Authentication
  MISSING_API_KEY: 'MISSING_API_KEY',
  INVALID_API_KEY: 'INVALID_API_KEY',
  EXPIRED_API_KEY: 'EXPIRED_API_KEY',
  SUSPENDED_ACCOUNT: 'SUSPENDED_ACCOUNT',
  
  // Authorization
  INSUFFICIENT_SCOPE: 'INSUFFICIENT_SCOPE',
  INSTITUTION_NOT_ALLOWED: 'INSTITUTION_NOT_ALLOWED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DAILY_LIMIT_EXCEEDED: 'DAILY_LIMIT_EXCEEDED',
  MONTHLY_LIMIT_EXCEEDED: 'MONTHLY_LIMIT_EXCEEDED',
  
  // Validation
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  
  // Resources
  INSTITUTION_NOT_FOUND: 'INSTITUTION_NOT_FOUND',
  NO_DATA_AVAILABLE: 'NO_DATA_AVAILABLE',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// ============================================
// Tier Configuration
// ============================================

/**
 * Tier limits - MUST match the get_tier_limits() function in Supabase
 * See: supabase/api_tier_limits_fix.sql
 */
export const TIER_LIMITS: Record<ApiTier, {
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  monthlyRequestLimit: number;
  maxInstitutions: number;
  maxResultsPerQuery: number;
  scopes: string[];
}> = {
  starter: {
    rateLimitPerMinute: 10,      // Free tier: strict limits
    rateLimitPerDay: 100,
    monthlyRequestLimit: 1000,
    maxInstitutions: 1,
    maxResultsPerQuery: 50,      // Limit data aggregations
    scopes: ['read:aggregates'],
  },
  pro: {
    rateLimitPerMinute: 60,
    rateLimitPerDay: 5000,
    monthlyRequestLimit: 50000,
    maxInstitutions: 5,
    maxResultsPerQuery: 500,
    scopes: ['read:aggregates', 'read:trends'],
  },
  enterprise: {
    rateLimitPerMinute: 500,
    rateLimitPerDay: 100000,
    monthlyRequestLimit: -1,     // Unlimited
    maxInstitutions: -1,         // All institutions
    maxResultsPerQuery: -1,      // Unlimited
    scopes: ['read:aggregates', 'read:trends', 'read:compare', 'read:flows', 'read:all'],
  },
};

// ============================================
// Constants
// ============================================

export const K_ANONYMITY_THRESHOLD = 5; // Minimum users per bucket
export const API_VERSION = 'v1';
export const API_KEY_PREFIX = 'flock_sk_';

