/**
 * API Response Helpers
 * Standardized response formatting for the API
 */

import { NextResponse } from 'next/server';
import { API_ERROR_CODES, type ApiResponse, type ApiError, type ApiMeta } from './types';

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a successful API response
 */
export function apiSuccess<T>(
  data: T,
  options: {
    status?: number;
    headers?: Record<string, string>;
    meta?: Partial<ApiMeta>;
    requestId?: string;
  } = {}
): NextResponse<ApiResponse<T>> {
  const requestId = options.requestId || generateRequestId();
  
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      request_id: requestId,
      timestamp: new Date().toISOString(),
      ...options.meta,
    },
  };
  
  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...getSecurityHeaders(),
      ...options.headers,
    },
  });
}

/**
 * Create an error API response
 */
export function apiError(
  code: string,
  message: string,
  options: {
    status?: number;
    details?: Record<string, unknown>;
    headers?: Record<string, string>;
    requestId?: string;
  } = {}
): NextResponse<ApiResponse<never>> {
  const requestId = options.requestId || generateRequestId();
  
  // Map error codes to HTTP status codes
  const statusMap: Record<string, number> = {
    [API_ERROR_CODES.MISSING_API_KEY]: 401,
    [API_ERROR_CODES.INVALID_API_KEY]: 401,
    [API_ERROR_CODES.EXPIRED_API_KEY]: 401,
    [API_ERROR_CODES.SUSPENDED_ACCOUNT]: 403,
    [API_ERROR_CODES.INSUFFICIENT_SCOPE]: 403,
    [API_ERROR_CODES.INSTITUTION_NOT_ALLOWED]: 403,
    [API_ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
    [API_ERROR_CODES.DAILY_LIMIT_EXCEEDED]: 429,
    [API_ERROR_CODES.MONTHLY_LIMIT_EXCEEDED]: 429,
    [API_ERROR_CODES.INVALID_REQUEST]: 400,
    [API_ERROR_CODES.INVALID_PARAMETER]: 400,
    [API_ERROR_CODES.MISSING_PARAMETER]: 400,
    [API_ERROR_CODES.INSTITUTION_NOT_FOUND]: 404,
    [API_ERROR_CODES.NO_DATA_AVAILABLE]: 404,
    [API_ERROR_CODES.INTERNAL_ERROR]: 500,
    [API_ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
  };
  
  const status = options.status || statusMap[code] || 500;
  
  const error: ApiError = {
    code,
    message,
    ...(options.details && { details: options.details }),
  };
  
  const response: ApiResponse<never> = {
    success: false,
    error,
    meta: {
      request_id: requestId,
      timestamp: new Date().toISOString(),
    },
  };
  
  return NextResponse.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...getSecurityHeaders(),
      ...options.headers,
    },
  });
}

/**
 * Common error responses
 */
export const errors = {
  unauthorized: (message = 'Authentication required') =>
    apiError(API_ERROR_CODES.MISSING_API_KEY, message, { status: 401 }),
  
  invalidApiKey: (message = 'Invalid or inactive API key') =>
    apiError(API_ERROR_CODES.INVALID_API_KEY, message, { status: 401 }),
  
  forbidden: (message = 'Access denied') =>
    apiError(API_ERROR_CODES.INSUFFICIENT_SCOPE, message, { status: 403 }),
  
  institutionNotAllowed: (institutionId: string) =>
    apiError(
      API_ERROR_CODES.INSTITUTION_NOT_ALLOWED,
      `Your API key does not have access to institution ${institutionId}`,
      { status: 403 }
    ),
  
  rateLimited: (retryAfter: number, headers: Record<string, string>) =>
    apiError(
      API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      { status: 429, headers }
    ),
  
  notFound: (resource = 'Resource') =>
    apiError(API_ERROR_CODES.INSTITUTION_NOT_FOUND, `${resource} not found`, { status: 404 }),
  
  noData: (message = 'No data available for the specified filters') =>
    apiError(API_ERROR_CODES.NO_DATA_AVAILABLE, message, { status: 404 }),
  
  badRequest: (message: string, details?: Record<string, unknown>) =>
    apiError(API_ERROR_CODES.INVALID_REQUEST, message, { status: 400, details }),
  
  invalidParam: (param: string, message: string) =>
    apiError(
      API_ERROR_CODES.INVALID_PARAMETER,
      `Invalid parameter '${param}': ${message}`,
      { status: 400, details: { parameter: param } }
    ),
  
  missingParam: (param: string) =>
    apiError(
      API_ERROR_CODES.MISSING_PARAMETER,
      `Required parameter '${param}' is missing`,
      { status: 400, details: { parameter: param } }
    ),
  
  internal: (message = 'An internal error occurred') =>
    apiError(API_ERROR_CODES.INTERNAL_ERROR, message, { status: 500 }),
  
  unavailable: (message = 'Service temporarily unavailable') =>
    apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, message, { status: 503 }),
};

/**
 * Allowed CORS origins
 * In production, this should be a strict whitelist
 */
const ALLOWED_ORIGINS = [
  'https://flock.app',
  'https://www.flock.app',
  'https://api.flock.app',
  // Add customer domains here or use a database lookup
];

// Development origins
if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://127.0.0.1:3000');
}

/**
 * CORS headers for API responses
 * Uses strict origin validation in production
 */
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  // Validate origin against whitelist
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Security headers for all API responses
 * @param cacheable - If true, allow caching for 5 minutes (for aggregated data)
 */
export function getSecurityHeaders(cacheable = false): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    // Allow caching for aggregated data to reduce server load
    'Cache-Control': cacheable 
      ? 'public, max-age=300, s-maxage=300' // 5 minutes
      : 'no-store, no-cache, must-revalidate, private',
    ...(cacheable ? {} : { 'Pragma': 'no-cache' }),
  };
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export function handleCors(request: Request): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }
  return null;
}

