/**
 * GET /api/v1/institutions/:id/employment
 * Get employment statistics for an institution's alumni
 */

import { withApiAuth, apiSuccess, errors } from '@/lib/api';
import { getEmploymentStats, type EmploymentFilters } from '@/lib/api/aggregation';

export const GET = withApiAuth(async ({ request, params }) => {
  const institutionId = params.id;
  const searchParams = new URL(request.url).searchParams;
  
  // Parse query parameters
  const gradYearMin = searchParams.get('grad_year_min');
  const gradYearMax = searchParams.get('grad_year_max');
  const status = searchParams.get('status');
  
  // Validate status
  const validStatuses = ['employed', 'grad_school', 'internship', 'looking', 'other'];
  if (status && !validStatuses.includes(status)) {
    return errors.invalidParam('status', `Must be one of: ${validStatuses.join(', ')}`);
  }
  
  // Validate grad years
  if (gradYearMin && (isNaN(Number(gradYearMin)) || Number(gradYearMin) < 1950)) {
    return errors.invalidParam('grad_year_min', 'Must be a valid year >= 1950');
  }
  if (gradYearMax && (isNaN(Number(gradYearMax)) || Number(gradYearMax) > 2100)) {
    return errors.invalidParam('grad_year_max', 'Must be a valid year <= 2100');
  }
  
  const filters: EmploymentFilters = {
    gradYearMin: gradYearMin ? Number(gradYearMin) : undefined,
    gradYearMax: gradYearMax ? Number(gradYearMax) : undefined,
    status: status || undefined,
  };
  
  const result = await getEmploymentStats(institutionId, filters);
  
  if (!result) {
    return errors.notFound('Institution');
  }
  
  return apiSuccess(result);
}, {
  requiredScope: 'read:aggregates',
  institutionIdParam: 'id',
});

