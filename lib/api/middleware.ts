/**
 * API Middleware
 * Combined authentication, rate limiting, and request handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getClientIp, hasScope, canAccessInstitution } from './auth';
import { checkApiRateLimits } from './rate-limit';
import { apiError, errors, getCorsHeaders, generateRequestId } from './response';
import { logApiUsage } from './usage';
import type { ApiContext } from './types';

export interface ApiHandlerContext {
  request: NextRequest;
  context: ApiContext;
  requestId: string;
  params: Record<string, string>;
}

export type ApiHandler<T = unknown> = (ctx: ApiHandlerContext) => Promise<NextResponse<T>>;

interface WithApiAuthOptions {
  requiredScope?: string;
  institutionIdParam?: string; // e.g., 'id' to check params.id against allowed institutions
}

/**
 * Higher-order function to wrap API routes with auth, rate limiting, and logging
 */
export function withApiAuth<T>(
  handler: ApiHandler<T>,
  options: WithApiAuthOptions = {}
) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const resolvedParams = await params;
    
    // Add CORS headers to all responses
    const corsHeaders = getCorsHeaders(request.headers.get('origin'));
    
    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }
    
    // 1. Validate API key
    const authResult = await validateApiKey(request);
    
    if (!authResult.success) {
      const response = apiError(authResult.error.code, authResult.error.message, {
        status: authResult.error.status,
        requestId,
        headers: corsHeaders,
      });
      
      // Log failed auth attempt (fire-and-forget, non-blocking)
      logApiUsage({
        endpoint: new URL(request.url).pathname,
        method: request.method,
        path: request.url,
        statusCode: authResult.error.status,
        responseTimeMs: Date.now() - startTime,
        errorCode: authResult.error.code,
        errorMessage: authResult.error.message,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
      });
      
      return response;
    }
    
    const context = authResult.context;
    
    // 2. Check required scope
    if (options.requiredScope && !hasScope(context, options.requiredScope)) {
      const response = apiError(
        'INSUFFICIENT_SCOPE',
        `This endpoint requires the '${options.requiredScope}' scope.`,
        { status: 403, requestId, headers: corsHeaders }
      );
      
      await logApiUsage({
        apiKeyId: context.keyId,
        customerId: context.customerId,
        endpoint: new URL(request.url).pathname,
        method: request.method,
        path: request.url,
        statusCode: 403,
        responseTimeMs: Date.now() - startTime,
        errorCode: 'INSUFFICIENT_SCOPE',
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
      });
      
      return response;
    }
    
    // 3. Check institution access if required
    if (options.institutionIdParam && resolvedParams[options.institutionIdParam]) {
      const institutionId = resolvedParams[options.institutionIdParam];
      if (!canAccessInstitution(context, institutionId)) {
        const response = errors.institutionNotAllowed(institutionId);
        
        // Non-blocking logging
        logApiUsage({
          apiKeyId: context.keyId,
          customerId: context.customerId,
          endpoint: new URL(request.url).pathname,
          method: request.method,
          path: request.url,
          statusCode: 403,
          responseTimeMs: Date.now() - startTime,
          errorCode: 'INSTITUTION_NOT_ALLOWED',
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent'),
        });
        
        return response;
      }
    }
    
    // 4. Check rate limits
    const rateLimitResult = await checkApiRateLimits(context);
    
    if (!rateLimitResult.allowed) {
      const response = apiError(
        rateLimitResult.error!.code,
        rateLimitResult.error!.message,
        {
          status: 429,
          requestId,
          headers: { ...corsHeaders, ...rateLimitResult.headers },
        }
      );
      
      // Non-blocking logging
      logApiUsage({
        apiKeyId: context.keyId,
        customerId: context.customerId,
        endpoint: new URL(request.url).pathname,
        method: request.method,
        path: request.url,
        statusCode: 429,
        responseTimeMs: Date.now() - startTime,
        errorCode: rateLimitResult.error!.code,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
      });
      
      return response;
    }
    
    // 5. Execute the handler
    try {
      const response = await handler({
        request,
        context,
        requestId,
        params: resolvedParams,
      });
      
      // Add CORS and rate limit headers to response
      const finalHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([k, v]) => finalHeaders.set(k, v));
      Object.entries(rateLimitResult.headers).forEach(([k, v]) => finalHeaders.set(k, v));
      finalHeaders.set('X-Request-ID', requestId);
      
      // Log successful request (non-blocking)
      logApiUsage({
        apiKeyId: context.keyId,
        customerId: context.customerId,
        endpoint: new URL(request.url).pathname,
        method: request.method,
        path: request.url,
        statusCode: response.status,
        responseTimeMs: Date.now() - startTime,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
      });
      
      return new NextResponse(response.body, {
        status: response.status,
        headers: finalHeaders,
      });
    } catch (error) {
      console.error('API Handler Error:', error);
      
      const response = errors.internal(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
      
      // Non-blocking logging
      logApiUsage({
        apiKeyId: context.keyId,
        customerId: context.customerId,
        endpoint: new URL(request.url).pathname,
        method: request.method,
        path: request.url,
        statusCode: 500,
        responseTimeMs: Date.now() - startTime,
        errorCode: 'INTERNAL_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
      });
      
      return response;
    }
  };
}

