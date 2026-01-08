-- ===================================
-- FIX: Update tier limits to match documented values
-- ===================================
-- The original function had higher limits than intended
-- This updates them to match the free tier limits

CREATE OR REPLACE FUNCTION get_tier_limits(tier_name TEXT)
RETURNS TABLE (
  rate_limit_per_minute INT,
  rate_limit_per_day INT,
  monthly_request_limit INT,
  max_institutions INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE tier_name
      WHEN 'starter' THEN 10    -- Free tier: 10 req/min
      WHEN 'pro' THEN 60        -- Pro: 60 req/min
      WHEN 'enterprise' THEN 500 -- Enterprise: 500 req/min
      ELSE 10
    END as rate_limit_per_minute,
    CASE tier_name
      WHEN 'starter' THEN 100      -- Free tier: 100 req/day
      WHEN 'pro' THEN 5000         -- Pro: 5000 req/day
      WHEN 'enterprise' THEN 100000 -- Enterprise: 100,000 req/day
      ELSE 100
    END as rate_limit_per_day,
    CASE tier_name
      WHEN 'starter' THEN 1000      -- Free tier: 1000 req/month
      WHEN 'pro' THEN 50000         -- Pro: 50,000 req/month
      WHEN 'enterprise' THEN -1     -- Enterprise: Unlimited
      ELSE 1000
    END as monthly_request_limit,
    CASE tier_name
      WHEN 'starter' THEN 1   -- Free tier: 1 institution
      WHEN 'pro' THEN 5       -- Pro: 5 institutions
      WHEN 'enterprise' THEN -1 -- Enterprise: All
      ELSE 1
    END as max_institutions;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

