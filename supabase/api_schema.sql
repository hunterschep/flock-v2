-- ===================================
-- FLOCK API SCHEMA
-- ===================================
-- Enterprise API for institutional access to aggregated alumni data
-- Version: 1.0.0
-- 
-- Privacy-first design:
-- - Never exposes individual PII
-- - K-anonymity enforced (min 5 users per bucket)
-- - All responses are aggregates only

-- ===================================
-- API CUSTOMERS
-- ===================================
-- Organizations that purchase API access
CREATE TABLE api_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-safe identifier
  
  -- Contact
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  billing_email TEXT,
  
  -- Subscription
  tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'pending')),
  
  -- Access controls
  allowed_institution_ids UUID[] DEFAULT '{}', -- Empty = tier-based access, populated = specific access
  
  -- Tier limits (can be overridden per-customer)
  custom_rate_limit_per_minute INT,
  custom_rate_limit_per_day INT,
  custom_monthly_request_limit INT,
  
  -- Billing (Stripe integration)
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT, -- Internal notes
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_customers_slug ON api_customers(slug);
CREATE INDEX idx_api_customers_status ON api_customers(status);
CREATE INDEX idx_api_customers_stripe ON api_customers(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ===================================
-- API KEYS
-- ===================================
-- Authentication keys for API access
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES api_customers(id) ON DELETE CASCADE,
  
  -- Key identification (store hashed, never plaintext)
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the actual key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification: "flock_sk_"
  
  -- Metadata
  name TEXT NOT NULL DEFAULT 'Default Key', -- "Production", "Development", etc.
  description TEXT,
  
  -- Permissions (scopes)
  scopes TEXT[] DEFAULT ARRAY['read:aggregates']::TEXT[],
  -- Available scopes:
  -- 'read:aggregates' - Basic aggregated data
  -- 'read:trends' - Time-series data
  -- 'read:compare' - Cross-institution comparisons
  -- 'read:flows' - Migration flow data
  -- 'read:all' - Full access
  
  -- Rate limiting (overrides customer defaults if set)
  rate_limit_per_minute INT,
  rate_limit_per_day INT,
  
  -- Environment
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'development', 'test')),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  usage_count BIGINT DEFAULT 0, -- Lifetime usage counter
  
  -- Expiration (optional)
  expires_at TIMESTAMPTZ,
  
  -- IP whitelist (optional, for enterprise)
  allowed_ips INET[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_api_keys_customer ON api_keys(customer_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- ===================================
-- API USAGE LOGS
-- ===================================
-- Request-level logging for analytics and billing
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Attribution
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES api_customers(id) ON DELETE CASCADE,
  
  -- Request details
  endpoint TEXT NOT NULL, -- '/v1/institutions/:id/locations'
  method TEXT NOT NULL DEFAULT 'GET',
  path TEXT NOT NULL, -- Actual path with IDs
  query_params JSONB, -- Sanitized query parameters
  
  -- Response
  status_code INT NOT NULL,
  response_time_ms INT,
  response_size_bytes INT,
  
  -- Error tracking
  error_code TEXT, -- Custom error codes
  error_message TEXT,
  
  -- Client info
  ip_address INET,
  user_agent TEXT,
  
  -- Billing
  billable_units INT DEFAULT 1, -- Some endpoints may cost more
  
  -- Timestamp (partition key)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partitioning by month for efficient queries and cleanup
-- (Run this after table creation in production)
-- CREATE INDEX idx_api_usage_customer_date ON api_usage(customer_id, created_at);
-- CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint, created_at);
-- CREATE INDEX idx_api_usage_key ON api_usage(api_key_id, created_at) WHERE api_key_id IS NOT NULL;

CREATE INDEX idx_api_usage_customer_date ON api_usage(customer_id, created_at DESC);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint, created_at DESC);
CREATE INDEX idx_api_usage_status ON api_usage(status_code, created_at DESC);

-- ===================================
-- AGGREGATED STATS (PRE-COMPUTED)
-- ===================================
-- Pre-computed aggregates refreshed daily
-- This avoids expensive real-time queries
CREATE TABLE aggregated_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dimensions
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  time_period TEXT NOT NULL, -- 'all_time', 'ytd', '2024', '2024-Q1', '2024-01'
  grad_year_min INT, -- Filter: minimum grad year (inclusive)
  grad_year_max INT, -- Filter: maximum grad year (inclusive)
  
  -- Counts (raw, before k-anonymity)
  total_users INT NOT NULL DEFAULT 0,
  
  -- Location distribution (k-anonymized)
  location_by_city JSONB DEFAULT '{}'::jsonb, -- {"San Francisco, CA": 145, ...}
  location_by_state JSONB DEFAULT '{}'::jsonb,
  location_by_country JSONB DEFAULT '{}'::jsonb,
  
  -- Employment distribution
  status_distribution JSONB DEFAULT '{}'::jsonb, -- {"employed": 450, "grad_school": 120, ...}
  top_employers JSONB DEFAULT '[]'::jsonb, -- [{"name": "Google", "count": 45}, ...]
  top_job_titles JSONB DEFAULT '[]'::jsonb,
  
  -- Graduate school distribution
  top_grad_schools JSONB DEFAULT '[]'::jsonb,
  degree_distribution JSONB DEFAULT '{}'::jsonb, -- {"MBA": 120, "JD": 80, ...}
  program_distribution JSONB DEFAULT '{}'::jsonb,
  
  -- Roommate seekers
  looking_for_roommate_count INT DEFAULT 0,
  
  -- Metadata
  last_computed_at TIMESTAMPTZ DEFAULT NOW(),
  computation_time_ms INT, -- How long aggregation took
  
  -- Unique constraint for upsert
  UNIQUE(institution_id, time_period, grad_year_min, grad_year_max)
);

-- Index for lookups
CREATE INDEX idx_aggregated_stats_lookup 
  ON aggregated_stats(institution_id, time_period);

CREATE INDEX idx_aggregated_stats_computed 
  ON aggregated_stats(last_computed_at DESC);

-- ===================================
-- USAGE SUMMARIES (DAILY ROLLUPS)
-- ===================================
-- Daily usage summaries for billing and analytics
CREATE TABLE api_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  customer_id UUID NOT NULL REFERENCES api_customers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Request counts
  total_requests INT DEFAULT 0,
  successful_requests INT DEFAULT 0,
  failed_requests INT DEFAULT 0,
  
  -- By endpoint
  requests_by_endpoint JSONB DEFAULT '{}'::jsonb,
  
  -- Performance
  avg_response_time_ms INT,
  p95_response_time_ms INT,
  
  -- Billing
  total_billable_units INT DEFAULT 0,
  
  -- Unique constraint
  UNIQUE(customer_id, date)
);

CREATE INDEX idx_api_usage_daily_customer ON api_usage_daily(customer_id, date DESC);

-- ===================================
-- WEBHOOK DELIVERIES (OPTIONAL)
-- ===================================
-- Track webhook delivery attempts for enterprise customers
CREATE TABLE api_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES api_customers(id) ON DELETE CASCADE,
  
  -- Configuration
  url TEXT NOT NULL,
  events TEXT[] DEFAULT ARRAY['data.updated']::TEXT[],
  secret_hash TEXT, -- For signature verification
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES api_webhooks(id) ON DELETE CASCADE,
  
  -- Delivery details
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  
  -- Response
  status_code INT,
  response_body TEXT,
  response_time_ms INT,
  
  -- Retry tracking
  attempt_number INT DEFAULT 1,
  next_retry_at TIMESTAMPTZ,
  
  -- Status
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- FUNCTIONS
-- ===================================

-- Function to get tier limits
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
      WHEN 'starter' THEN 60
      WHEN 'pro' THEN 300
      WHEN 'enterprise' THEN 1000
      ELSE 60
    END as rate_limit_per_minute,
    CASE tier_name
      WHEN 'starter' THEN 10000
      WHEN 'pro' THEN 100000
      WHEN 'enterprise' THEN 1000000
      ELSE 10000
    END as rate_limit_per_day,
    CASE tier_name
      WHEN 'starter' THEN 100000
      WHEN 'pro' THEN 1000000
      WHEN 'enterprise' THEN -1 -- Unlimited
      ELSE 100000
    END as monthly_request_limit,
    CASE tier_name
      WHEN 'starter' THEN 1
      WHEN 'pro' THEN 5
      WHEN 'enterprise' THEN -1 -- All
      ELSE 1
    END as max_institutions;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate API key and return customer info
CREATE OR REPLACE FUNCTION validate_api_key(key_hash_input TEXT)
RETURNS TABLE (
  key_id UUID,
  customer_id UUID,
  customer_name TEXT,
  customer_slug TEXT,
  tier TEXT,
  scopes TEXT[],
  rate_limit_per_minute INT,
  rate_limit_per_day INT,
  allowed_institution_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.id as key_id,
    c.id as customer_id,
    c.name as customer_name,
    c.slug as customer_slug,
    c.tier,
    k.scopes,
    COALESCE(k.rate_limit_per_minute, c.custom_rate_limit_per_minute, tl.rate_limit_per_minute) as rate_limit_per_minute,
    COALESCE(k.rate_limit_per_day, c.custom_rate_limit_per_day, tl.rate_limit_per_day) as rate_limit_per_day,
    c.allowed_institution_ids
  FROM api_keys k
  JOIN api_customers c ON k.customer_id = c.id
  CROSS JOIN LATERAL get_tier_limits(c.tier) AS tl
  WHERE k.key_hash = key_hash_input
    AND k.is_active = TRUE
    AND c.status = 'active'
    AND (k.expires_at IS NULL OR k.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
  p_api_key_id UUID,
  p_customer_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_path TEXT,
  p_query_params JSONB,
  p_status_code INT,
  p_response_time_ms INT,
  p_response_size_bytes INT,
  p_error_code TEXT,
  p_error_message TEXT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_billable_units INT DEFAULT 1
)
RETURNS UUID AS $$
DECLARE
  usage_id UUID;
BEGIN
  INSERT INTO api_usage (
    api_key_id, customer_id, endpoint, method, path, query_params,
    status_code, response_time_ms, response_size_bytes,
    error_code, error_message, ip_address, user_agent, billable_units
  ) VALUES (
    p_api_key_id, p_customer_id, p_endpoint, p_method, p_path, p_query_params,
    p_status_code, p_response_time_ms, p_response_size_bytes,
    p_error_code, p_error_message, p_ip_address, p_user_agent, p_billable_units
  )
  RETURNING id INTO usage_id;
  
  -- Update key's last_used_at and usage_count
  IF p_api_key_id IS NOT NULL THEN
    UPDATE api_keys 
    SET last_used_at = NOW(), usage_count = usage_count + 1
    WHERE id = p_api_key_id;
  END IF;
  
  RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- TRIGGERS
-- ===================================

-- Update updated_at on api_customers
CREATE TRIGGER update_api_customers_updated_at
  BEFORE UPDATE ON api_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- PERMISSIONS
-- ===================================

-- These tables should NOT be accessible via PostgREST
-- They are accessed via server-side functions only
REVOKE ALL ON api_customers FROM anon, authenticated;
REVOKE ALL ON api_keys FROM anon, authenticated;
REVOKE ALL ON api_usage FROM anon, authenticated;
REVOKE ALL ON api_usage_daily FROM anon, authenticated;
REVOKE ALL ON aggregated_stats FROM anon, authenticated;
REVOKE ALL ON api_webhooks FROM anon, authenticated;
REVOKE ALL ON api_webhook_deliveries FROM anon, authenticated;

-- Grant to service role only (for server-side operations)
GRANT ALL ON api_customers TO service_role;
GRANT ALL ON api_keys TO service_role;
GRANT ALL ON api_usage TO service_role;
GRANT ALL ON api_usage_daily TO service_role;
GRANT ALL ON aggregated_stats TO service_role;
GRANT ALL ON api_webhooks TO service_role;
GRANT ALL ON api_webhook_deliveries TO service_role;

-- ===================================
-- SEED DATA (DEVELOPMENT)
-- ===================================

-- Insert a test customer
INSERT INTO api_customers (name, slug, contact_name, contact_email, tier, status)
VALUES ('Test University', 'test-university', 'Test Admin', 'admin@test.edu', 'pro', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

