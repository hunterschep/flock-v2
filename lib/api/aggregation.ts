/**
 * Aggregation Service
 * Computes anonymized statistics from user data
 * Enforces k-anonymity to protect individual privacy
 * 
 * Performance optimizations:
 * - In-memory cache with TTL for repeated queries
 * - Shared Supabase client
 * - Parallel queries where possible
 */

import {
  K_ANONYMITY_THRESHOLD,
  type LocationDistribution,
  type EmployerData,
  type StatusDistribution,
  type InstitutionSummary,
  type LocationsResponse,
  type EmploymentResponse,
  type GradSchoolsResponse,
} from './types';
import { getServiceClient } from './supabase';

// ============================================
// In-Memory Cache (TTL-based)
// ============================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Cache TTL: 5 minutes for aggregated data (this data doesn't change frequently)
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  
  // Prevent memory bloat - limit cache to 100 entries
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

// ============================================
// K-Anonymity Helpers
// ============================================

/**
 * Filter out entries that don't meet the k-anonymity threshold
 * Returns entries with count >= K_ANONYMITY_THRESHOLD
 * @internal Reserved for future use with array-based filtering
 */
function _enforceKAnonymity<T extends { count: number }>(
  data: T[],
  threshold = K_ANONYMITY_THRESHOLD
): T[] {
  return data.filter(item => item.count >= threshold);
}

/**
 * Enforce k-anonymity on a record/object
 * Returns only keys with values >= threshold
 */
function enforceKAnonymityRecord(
  data: Record<string, number>,
  threshold = K_ANONYMITY_THRESHOLD
): Record<string, number> {
  const result: Record<string, number> = {};
  let suppressed = 0;

  for (const [key, count] of Object.entries(data)) {
    if (count >= threshold) {
      result[key] = count;
    } else {
      suppressed += count;
    }
  }

  // Optionally add "Other" bucket if suppressed count meets threshold
  if (suppressed >= threshold) {
    result['Other'] = suppressed;
  }

  return result;
}

/**
 * Calculate percentage with k-anonymity
 */
function calculatePercentages(
  data: Record<string, number>,
  total: number
): Record<string, { count: number; percentage: number }> {
  const result: Record<string, { count: number; percentage: number }> = {};

  for (const [key, count] of Object.entries(data)) {
    result[key] = {
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0, // Round to 1 decimal
    };
  }

  return result;
}

// ============================================
// Institution Helpers
// ============================================

/**
 * Get institution summary by ID (with caching)
 */
export async function getInstitutionSummary(
  institutionId: string
): Promise<InstitutionSummary | null> {
  const cacheKey = `institution:${institutionId}`;
  const cached = getCached<InstitutionSummary>(cacheKey);
  if (cached) return cached;

  const supabase = getServiceClient();
  
  // Parallel queries for institution data and count
  const [institutionResult, countResult] = await Promise.all([
    supabase
      .from('institutions')
      .select('id, name, domain')
      .eq('id', institutionId)
      .single(),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .eq('onboarding_completed', true)
      .eq('profile_visible', true),
  ]);

  if (institutionResult.error || !institutionResult.data) {
    return null;
  }

  const result: InstitutionSummary = {
    id: institutionResult.data.id,
    name: institutionResult.data.name,
    domain: institutionResult.data.domain,
    total_alumni: countResult.count || 0,
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * List all institutions with summary data (with caching)
 */
export async function listInstitutions(): Promise<InstitutionSummary[]> {
  const cacheKey = 'institutions:list';
  const cached = getCached<InstitutionSummary[]>(cacheKey);
  if (cached) return cached;

  const supabase = getServiceClient();
  
  // Parallel queries for institutions and counts
  const [institutionsResult, countsResult] = await Promise.all([
    supabase
      .from('institutions')
      .select('id, name, domain')
      .order('name'),
    // Use a more efficient count query - group by institution_id
    supabase
      .from('users')
      .select('institution_id')
      .eq('onboarding_completed', true)
      .eq('profile_visible', true),
  ]);

  if (institutionsResult.error) {
    console.error('Error fetching institutions:', institutionsResult.error);
    return [];
  }

  if (!institutionsResult.data || institutionsResult.data.length === 0) {
    console.warn('No institutions found in database');
    return [];
  }

  const countMap: Record<string, number> = {};
  (countsResult.data || []).forEach(u => {
    if (u.institution_id) {
      countMap[u.institution_id] = (countMap[u.institution_id] || 0) + 1;
    }
  });

  const result = institutionsResult.data.map(inst => ({
    id: inst.id,
    name: inst.name,
    domain: inst.domain,
    total_alumni: countMap[inst.id] || 0,
  }));

  setCache(cacheKey, result);
  return result;
}

// ============================================
// Location Aggregation
// ============================================

export interface LocationFilters {
  granularity: 'city' | 'state' | 'country';
  gradYearMin?: number;
  gradYearMax?: number;
}

/**
 * Get location distribution for an institution (with caching)
 */
export async function getLocationDistribution(
  institutionId: string,
  filters: LocationFilters
): Promise<LocationsResponse | null> {
  const cacheKey = `locations:${institutionId}:${filters.granularity}:${filters.gradYearMin || ''}:${filters.gradYearMax || ''}`;
  const cached = getCached<LocationsResponse>(cacheKey);
  if (cached) return cached;

  const supabase = getServiceClient();
  
  // Parallel: get institution summary while fetching user data
  const institutionPromise = getInstitutionSummary(institutionId);

  // Build query
  let query = supabase
    .from('users')
    .select('city, state, country')
    .eq('institution_id', institutionId)
    .eq('onboarding_completed', true)
    .eq('profile_visible', true);

  // Apply grad year filters
  if (filters.gradYearMin) {
    query = query.gte('grad_year', filters.gradYearMin);
  }
  if (filters.gradYearMax) {
    query = query.lte('grad_year', filters.gradYearMax);
  }

  // Wait for both queries
  const [institution, { data: users, error }] = await Promise.all([
    institutionPromise,
    query,
  ]);

  if (!institution) return null;

  if (error) {
    console.error('Error fetching location data:', error);
    return null;
  }

  // Aggregate by granularity
  const locationCounts: Record<string, number> = {};
  let totalWithLocation = 0;

  (users || []).forEach(user => {
    let locationKey: string | null = null;

    switch (filters.granularity) {
      case 'city':
        if (user.city && user.state) {
          locationKey = `${user.city}, ${user.state}`;
        }
        break;
      case 'state':
        if (user.state) {
          locationKey = user.state;
        }
        break;
      case 'country':
        if (user.country) {
          locationKey = user.country;
        }
        break;
    }

    if (locationKey) {
      locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;
      totalWithLocation++;
    }
  });

  // Apply k-anonymity
  const anonymizedCounts = enforceKAnonymityRecord(locationCounts);

  // Convert to sorted array with percentages
  const distribution: LocationDistribution[] = Object.entries(anonymizedCounts)
    .map(([location, count]) => ({
      location,
      count,
      percentage: totalWithLocation > 0
        ? Math.round((count / totalWithLocation) * 1000) / 10
        : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const result: LocationsResponse = {
    institution,
    filters: {
      granularity: filters.granularity,
      grad_years: filters.gradYearMin && filters.gradYearMax
        ? [filters.gradYearMin, filters.gradYearMax]
        : undefined,
    },
    total_alumni: totalWithLocation,
    distribution,
    generated_at: new Date().toISOString(),
  };

  setCache(cacheKey, result);
  return result;
}

// ============================================
// Employment Aggregation
// ============================================

export interface EmploymentFilters {
  gradYearMin?: number;
  gradYearMax?: number;
  status?: string;
}

/**
 * Get employment statistics for an institution (with caching)
 */
export async function getEmploymentStats(
  institutionId: string,
  filters: EmploymentFilters
): Promise<EmploymentResponse | null> {
  const cacheKey = `employment:${institutionId}:${filters.gradYearMin || ''}:${filters.gradYearMax || ''}:${filters.status || ''}`;
  const cached = getCached<EmploymentResponse>(cacheKey);
  if (cached) return cached;

  const supabase = getServiceClient();
  
  // Parallel: get institution summary while fetching user data
  const institutionPromise = getInstitutionSummary(institutionId);

  // Build query
  let query = supabase
    .from('users')
    .select('status, employer, job_title')
    .eq('institution_id', institutionId)
    .eq('onboarding_completed', true)
    .eq('profile_visible', true);

  if (filters.gradYearMin) {
    query = query.gte('grad_year', filters.gradYearMin);
  }
  if (filters.gradYearMax) {
    query = query.lte('grad_year', filters.gradYearMax);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  // Wait for both queries
  const [institution, { data: users, error }] = await Promise.all([
    institutionPromise,
    query,
  ]);

  if (!institution) return null;

  if (error) {
    console.error('Error fetching employment data:', error);
    return null;
  }

  // Aggregate status
  const statusCounts: Record<string, number> = {
    employed: 0,
    grad_school: 0,
    internship: 0,
    looking: 0,
    other: 0,
  };

  const employerCounts: Record<string, number> = {};
  const jobTitleCounts: Record<string, number> = {};

  (users || []).forEach(user => {
    // Status
    const status = user.status || 'other';
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    // Employer (only for employed/internship)
    if ((user.status === 'employed' || user.status === 'internship') && user.employer) {
      employerCounts[user.employer] = (employerCounts[user.employer] || 0) + 1;
    }

    // Job title
    if (user.job_title) {
      jobTitleCounts[user.job_title] = (jobTitleCounts[user.job_title] || 0) + 1;
    }
  });

  const totalUsers = users?.length || 0;

  // Apply k-anonymity to employers and job titles
  const anonymizedEmployers = enforceKAnonymityRecord(employerCounts);
  const anonymizedJobTitles = enforceKAnonymityRecord(jobTitleCounts);

  // Convert to sorted arrays
  const topEmployers: EmployerData[] = Object.entries(anonymizedEmployers)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const topJobTitles: EmployerData[] = Object.entries(anonymizedJobTitles)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Build status breakdown with percentages
  const statusBreakdown: StatusDistribution = {
    employed: {
      count: statusCounts.employed,
      percentage: totalUsers > 0 ? Math.round((statusCounts.employed / totalUsers) * 1000) / 10 : 0,
    },
    grad_school: {
      count: statusCounts.grad_school,
      percentage: totalUsers > 0 ? Math.round((statusCounts.grad_school / totalUsers) * 1000) / 10 : 0,
    },
    internship: {
      count: statusCounts.internship,
      percentage: totalUsers > 0 ? Math.round((statusCounts.internship / totalUsers) * 1000) / 10 : 0,
    },
    looking: {
      count: statusCounts.looking,
      percentage: totalUsers > 0 ? Math.round((statusCounts.looking / totalUsers) * 1000) / 10 : 0,
    },
    other: {
      count: statusCounts.other,
      percentage: totalUsers > 0 ? Math.round((statusCounts.other / totalUsers) * 1000) / 10 : 0,
    },
  };

  const result: EmploymentResponse = {
    institution,
    filters: {
      grad_years: filters.gradYearMin && filters.gradYearMax
        ? [filters.gradYearMin, filters.gradYearMax]
        : undefined,
    },
    total_alumni: totalUsers,
    status_breakdown: statusBreakdown,
    top_employers: topEmployers,
    top_job_titles: topJobTitles,
    generated_at: new Date().toISOString(),
  };

  setCache(cacheKey, result);
  return result;
}

// ============================================
// Graduate School Aggregation
// ============================================

export interface GradSchoolFilters {
  gradYearMin?: number;
  gradYearMax?: number;
}

/**
 * Get graduate school statistics for an institution (with caching)
 */
export async function getGradSchoolStats(
  institutionId: string,
  filters: GradSchoolFilters
): Promise<GradSchoolsResponse | null> {
  const cacheKey = `gradschools:${institutionId}:${filters.gradYearMin || ''}:${filters.gradYearMax || ''}`;
  const cached = getCached<GradSchoolsResponse>(cacheKey);
  if (cached) return cached;

  const supabase = getServiceClient();
  
  // Parallel: get institution summary while fetching user data
  const institutionPromise = getInstitutionSummary(institutionId);

  // Build query
  let query = supabase
    .from('users')
    .select('grad_school, degree, program')
    .eq('institution_id', institutionId)
    .eq('onboarding_completed', true)
    .eq('profile_visible', true)
    .eq('status', 'grad_school');

  if (filters.gradYearMin) {
    query = query.gte('grad_year', filters.gradYearMin);
  }
  if (filters.gradYearMax) {
    query = query.lte('grad_year', filters.gradYearMax);
  }

  // Wait for both queries
  const [institution, { data: users, error }] = await Promise.all([
    institutionPromise,
    query,
  ]);

  if (!institution) return null;

  if (error) {
    console.error('Error fetching grad school data:', error);
    return null;
  }

  // Aggregate
  const schoolCounts: Record<string, number> = {};
  const degreeCounts: Record<string, number> = {};

  (users || []).forEach(user => {
    if (user.grad_school) {
      schoolCounts[user.grad_school] = (schoolCounts[user.grad_school] || 0) + 1;
    }
    if (user.degree) {
      degreeCounts[user.degree] = (degreeCounts[user.degree] || 0) + 1;
    }
  });

  const totalInGradSchool = users?.length || 0;

  // Apply k-anonymity
  const anonymizedSchools = enforceKAnonymityRecord(schoolCounts);
  const anonymizedDegrees = enforceKAnonymityRecord(degreeCounts);

  // Convert to sorted array
  const topSchools: EmployerData[] = Object.entries(anonymizedSchools)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Degree breakdown with percentages
  const degreeBreakdown = calculatePercentages(anonymizedDegrees, totalInGradSchool);

  const result: GradSchoolsResponse = {
    institution,
    filters: {
      grad_years: filters.gradYearMin && filters.gradYearMax
        ? [filters.gradYearMin, filters.gradYearMax]
        : undefined,
    },
    total_in_grad_school: totalInGradSchool,
    top_schools: topSchools,
    degree_breakdown: degreeBreakdown,
    generated_at: new Date().toISOString(),
  };

  setCache(cacheKey, result);
  return result;
}

// ============================================
// Pre-computed Stats (for caching)
// ============================================

/**
 * Compute and store aggregated stats for an institution
 * This should be run as a background job
 */
export async function computeAndStoreStats(
  institutionId: string,
  timePeriod = 'all_time'
): Promise<void> {
  const startTime = Date.now();

  const [locations, employment, gradSchools] = await Promise.all([
    getLocationDistribution(institutionId, { granularity: 'city' }),
    getEmploymentStats(institutionId, {}),
    getGradSchoolStats(institutionId, {}),
  ]);

  if (!locations || !employment || !gradSchools) {
    console.error(`Failed to compute stats for institution ${institutionId}`);
    return;
  }

  // Convert distributions to JSONB format
  const locationByCity: Record<string, number> = {};
  const locationByState: Record<string, number> = {};

  locations.distribution.forEach(loc => {
    locationByCity[loc.location] = loc.count;
    // Extract state from "City, State" format
    const parts = loc.location.split(', ');
    if (parts.length >= 2) {
      const state = parts[parts.length - 1];
      locationByState[state] = (locationByState[state] || 0) + loc.count;
    }
  });

  // Upsert aggregated stats
  const { error } = await getServiceClient()
    .from('aggregated_stats')
    .upsert({
      institution_id: institutionId,
      time_period: timePeriod,
      grad_year_min: null,
      grad_year_max: null,
      total_users: locations.total_alumni,
      location_by_city: locationByCity,
      location_by_state: locationByState,
      location_by_country: { 'United States': locations.total_alumni },
      status_distribution: employment.status_breakdown,
      top_employers: employment.top_employers,
      top_job_titles: employment.top_job_titles,
      top_grad_schools: gradSchools.top_schools,
      degree_distribution: gradSchools.degree_breakdown,
      last_computed_at: new Date().toISOString(),
      computation_time_ms: Date.now() - startTime,
    }, {
      onConflict: 'institution_id,time_period,grad_year_min,grad_year_max',
    });

  if (error) {
    console.error('Failed to store aggregated stats:', error);
  }
}

/**
 * Get pre-computed stats from cache
 */
export async function getCachedStats(
  institutionId: string,
  timePeriod = 'all_time'
): Promise<Record<string, unknown> | null> {
  const { data, error } = await getServiceClient()
    .from('aggregated_stats')
    .select('*')
    .eq('institution_id', institutionId)
    .eq('time_period', timePeriod)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Clear the in-memory cache (useful for testing or forcing refresh)
 */
export function clearCache(): void {
  cache.clear();
}

