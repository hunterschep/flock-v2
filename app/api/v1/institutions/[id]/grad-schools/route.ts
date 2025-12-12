/**
 * GET /api/v1/institutions/:id/grad-schools
 * Get graduate school statistics for an institution's alumni
 */

import { withApiAuth, apiSuccess, errors } from '@/lib/api';
import { getGradSchoolStats, type GradSchoolFilters } from '@/lib/api/aggregation';

export const GET = withApiAuth(async ({ request, params }) => {
  const institutionId = params.id;
  const searchParams = new URL(request.url).searchParams;
  
  // Parse query parameters
  const gradYearMin = searchParams.get('grad_year_min');
  const gradYearMax = searchParams.get('grad_year_max');
  
  // Validate grad years
  if (gradYearMin && (isNaN(Number(gradYearMin)) || Number(gradYearMin) < 1950)) {
    return errors.invalidParam('grad_year_min', 'Must be a valid year >= 1950');
  }
  if (gradYearMax && (isNaN(Number(gradYearMax)) || Number(gradYearMax) > 2100)) {
    return errors.invalidParam('grad_year_max', 'Must be a valid year <= 2100');
  }
  
  const filters: GradSchoolFilters = {
    gradYearMin: gradYearMin ? Number(gradYearMin) : undefined,
    gradYearMax: gradYearMax ? Number(gradYearMax) : undefined,
  };
  
  const result = await getGradSchoolStats(institutionId, filters);
  
  if (!result) {
    return errors.notFound('Institution');
  }
  
  return apiSuccess(result);
}, {
  requiredScope: 'read:aggregates',
  institutionIdParam: 'id',
});

