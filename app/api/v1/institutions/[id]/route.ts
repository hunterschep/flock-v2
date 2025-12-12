/**
 * GET /api/v1/institutions/:id
 * Get institution details and summary statistics
 */

import { withApiAuth, apiSuccess, errors } from '@/lib/api';
import { getInstitutionSummary, getCachedStats } from '@/lib/api/aggregation';

export const GET = withApiAuth(async ({ params }) => {
  const institutionId = params.id;
  
  // Get institution details
  const institution = await getInstitutionSummary(institutionId);
  
  if (!institution) {
    return errors.notFound('Institution');
  }
  
  // Try to get cached stats
  const cachedStats = await getCachedStats(institutionId);
  
  return apiSuccess({
    institution,
    summary: cachedStats ? {
      total_users: cachedStats.total_users,
      status_distribution: cachedStats.status_distribution,
      top_cities: Object.entries(cachedStats.location_by_city as Record<string, number> || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([city, count]) => ({ city, count })),
      last_updated: cachedStats.last_computed_at,
    } : null,
  });
}, {
  requiredScope: 'read:aggregates',
  institutionIdParam: 'id',
});

