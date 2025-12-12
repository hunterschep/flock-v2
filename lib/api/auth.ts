/**
 * API Authentication
 * Validates API keys and extracts customer context
 */

import { createHash } from 'crypto';
import { API_ERROR_CODES, API_KEY_PREFIX, type ApiContext, type ApiTier } from './types';
import { getServiceClient } from './supabase';

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key
 * Returns { key, hash, prefix } - key should only be shown once to user
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const randomString = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const key = `${API_KEY_PREFIX}${randomString}`;
  const hash = hashApiKey(key);
  const prefix = key.slice(0, 16); // "flock_sk_" + 7 chars
  
  return { key, hash, prefix };
}

/**
 * Extract API key from request headers
 * Supports: Authorization: Bearer <key>
 */
export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return null;
  }
  
  // Only support Bearer token format for security
  if (authHeader.startsWith('Bearer ')) {
    const key = authHeader.slice(7).trim();
    // Basic sanitization - API keys should only contain hex chars after prefix
    if (key && /^flock_sk_[a-f0-9]{64}$/.test(key)) {
      return key;
    }
  }
  
  return null;
}

type ValidateResult = {
  success: true;
  context: ApiContext;
} | {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
  };
};

/**
 * Validate an API key and return the customer context
 */
export async function validateApiKey(request: Request): Promise<ValidateResult> {
  const apiKey = extractApiKey(request);
  
  if (!apiKey) {
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.MISSING_API_KEY,
        message: 'API key is required. Include it in the Authorization header as "Bearer <key>" or in the X-API-Key header.',
        status: 401,
      },
    };
  }
  
  // Validate key format
  if (!apiKey.startsWith(API_KEY_PREFIX)) {
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.INVALID_API_KEY,
        message: 'Invalid API key format.',
        status: 401,
      },
    };
  }
  
  const keyHash = hashApiKey(apiKey);
  
  // Query the database using shared client
  const { data, error } = await getServiceClient().rpc('validate_api_key', {
    key_hash_input: keyHash,
  });
  
  if (error || !data || data.length === 0) {
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.INVALID_API_KEY,
        message: 'Invalid or inactive API key.',
        status: 401,
      },
    };
  }
  
  const keyData = data[0];
  
  return {
    success: true,
    context: {
      keyId: keyData.key_id,
      customerId: keyData.customer_id,
      customerName: keyData.customer_name,
      customerSlug: keyData.customer_slug,
      tier: keyData.tier as ApiTier,
      scopes: keyData.scopes,
      rateLimitPerMinute: keyData.rate_limit_per_minute,
      rateLimitPerDay: keyData.rate_limit_per_day,
      allowedInstitutionIds: keyData.allowed_institution_ids || [],
    },
  };
}

/**
 * Check if the API context has a required scope
 */
export function hasScope(context: ApiContext, requiredScope: string): boolean {
  // 'read:all' grants access to everything
  if (context.scopes.includes('read:all')) {
    return true;
  }
  
  return context.scopes.includes(requiredScope);
}

/**
 * Check if the customer can access a specific institution
 */
export function canAccessInstitution(context: ApiContext, institutionId: string): boolean {
  // Enterprise tier with empty array = all institutions
  if (context.tier === 'enterprise' && context.allowedInstitutionIds.length === 0) {
    return true;
  }
  
  // Check if institution is in allowed list
  if (context.allowedInstitutionIds.length > 0) {
    return context.allowedInstitutionIds.includes(institutionId);
  }
  
  // For starter/pro without explicit list, they need to have institutions assigned
  return false;
}

/**
 * Get client IP from request
 */
export function getClientIp(request: Request): string {
  // Check various headers for the real IP (behind proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Vercel-specific
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0].trim();
  }
  
  return '0.0.0.0';
}

