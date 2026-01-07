/**
 * GET /api/v1/institutions
 * List all institutions accessible to the API customer
 */

import { withApiAuth, apiSuccess, errors } from '@/lib/api';
import { listInstitutions } from '@/lib/api/aggregation';

export const GET = withApiAuth(async ({ context }) => {
  const institutions = await listInstitutions();
  
  // Filter to only allowed institutions (unless enterprise with full access)
  let filtered = institutions;
  
  if (context.tier !== 'enterprise' || context.allowedInstitutionIds.length > 0) {
    if (context.allowedInstitutionIds.length > 0) {
      filtered = institutions.filter(inst => 
        context.allowedInstitutionIds.includes(inst.id)
      );
    } else {
      // Non-enterprise without explicit access gets empty list
      filtered = [];
    }
  }
  
  if (filtered.length === 0) {
    return errors.noData('No institutions available for your API key. Contact support to configure access.');
  }
  
  return apiSuccess({
    institutions: filtered,
    total: filtered.length,
  });
}, {
  requiredScope: 'read:aggregates',
});

// OPTIONS is handled by the middleware - no separate handler needed

