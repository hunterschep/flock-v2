/**
 * Flock API Library
 * Main export file
 */

// Types
export * from './types';

// Shared Supabase Client
export { getServiceClient } from './supabase';

// Auth
export {
  validateApiKey,
  hashApiKey,
  generateApiKey,
  extractApiKey,
  hasScope,
  canAccessInstitution,
  getClientIp,
} from './auth';

// Rate Limiting
export {
  checkRateLimit,
  checkApiRateLimits,
  getUsageStats,
} from './rate-limit';

// Response Helpers
export {
  apiSuccess,
  apiError,
  errors,
  generateRequestId,
  getCorsHeaders,
  getSecurityHeaders,
  handleCors,
} from './response';

// Middleware
export {
  withApiAuth,
  type ApiHandler,
  type ApiHandlerContext,
} from './middleware';

// Usage Logging
export {
  logApiUsage,
  getCustomerUsageStats,
  getCurrentPeriodUsage,
} from './usage';

// Aggregation
export {
  listInstitutions,
  getInstitutionSummary,
  getLocationDistribution,
  getEmploymentStats,
  getGradSchoolStats,
  getCachedStats,
  computeAndStoreStats,
  clearCache,
} from './aggregation';

