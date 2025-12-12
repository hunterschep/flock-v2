/**
 * GET /api/v1/institutions/:id/locations
 * Get location distribution for an institution's alumni
 */

import { withApiAuth, apiSuccess, errors } from '@/lib/api';
import { getLocationDistribution, type LocationFilters } from '@/lib/api/aggregation';

export const GET = withApiAuth(async ({ request, params }) => {
  const institutionId = params.id;
  const searchParams = new URL(request.url).searchParams;
  
  // Parse query parameters
  const granularity = (searchParams.get('granularity') || 'city') as 'city' | 'state' | 'country';
  const gradYearMin = searchParams.get('grad_year_min');
  const gradYearMax = searchParams.get('grad_year_max');
  const minCount = searchParams.get('min_count');
  
  // Validate granularity
  if (!['city', 'state', 'country'].includes(granularity)) {
    return errors.invalidParam('granularity', 'Must be one of: city, state, country');
  }
  
  // Validate grad years
  if (gradYearMin && (isNaN(Number(gradYearMin)) || Number(gradYearMin) < 1950)) {
    return errors.invalidParam('grad_year_min', 'Must be a valid year >= 1950');
  }
  if (gradYearMax && (isNaN(Number(gradYearMax)) || Number(gradYearMax) > 2100)) {
    return errors.invalidParam('grad_year_max', 'Must be a valid year <= 2100');
  }
  
  const filters: LocationFilters = {
    granularity,
    gradYearMin: gradYearMin ? Number(gradYearMin) : undefined,
    gradYearMax: gradYearMax ? Number(gradYearMax) : undefined,
  };
  
  const result = await getLocationDistribution(institutionId, filters);
  
  if (!result) {
    return errors.notFound('Institution');
  }
  
  // Apply min_count filter if specified (client-side filtering beyond k-anonymity)
  let distribution = result.distribution;
  if (minCount && Number(minCount) > 5) {
    distribution = distribution.filter(loc => loc.count >= Number(minCount));
  }
  
  return apiSuccess({
    ...result,
    distribution,
  });
}, {
  requiredScope: 'read:aggregates',
  institutionIdParam: 'id',
});

