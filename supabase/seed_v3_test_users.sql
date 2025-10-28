-- Seed script for Optimized Schema V3
-- Date: 2025-10-28
-- Description: Creates 20 diverse test users for the merged users table
-- Includes: Privacy controls (show_school, show_employer), 30-day location lock, profile_visible always true

-- ⚠️ IMPORTANT: Run this ONLY after nuking and rebuilding the database!
-- 1. First run: DROP SCHEMA public CASCADE; CREATE SCHEMA public; ...
-- 2. Then run: schema_v3_optimized.sql
-- 3. Finally run: this file (seed_v3_test_users.sql)

-- ===================================
-- STEP 0: Clean up existing test users (if any)
-- ===================================

-- Delete test users from auth.users if they exist
DELETE FROM auth.users WHERE email IN (
  'sarah.chen@stanford.edu',
  'mike.johnson@stanford.edu',
  'priya.patel@berkeley.edu',
  'alex.rodriguez@stanford.edu',
  'emma.wilson@mit.edu',
  'james.brown@harvard.edu',
  'lisa.kim@mit.edu',
  'david.lee@uw.edu',
  'sophia.martinez@uw.edu',
  'ryan.taylor@utexas.edu',
  'olivia.garcia@utexas.edu',
  'ethan.white@gatech.edu',
  'maya.singh@cmu.edu',
  'noah.anderson@umich.edu',
  'ava.thomas@ucla.edu',
  'lucas.moore@ucla.edu',
  'jordan.clark@stanford.edu',
  'mia.harris@mit.edu',
  'william.jackson@stanford.edu',
  'isabella.martin@berkeley.edu'
);

-- ===================================
-- STEP 1: Create test auth users
-- ===================================

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new
)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  email,
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('full_name', full_name),
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  ''
FROM (VALUES
  ('sarah.chen@stanford.edu', 'Sarah Chen'),
  ('mike.johnson@stanford.edu', 'Mike Johnson'),
  ('priya.patel@berkeley.edu', 'Priya Patel'),
  ('alex.rodriguez@stanford.edu', 'Alex Rodriguez'),
  ('emma.wilson@mit.edu', 'Emma Wilson'),
  ('james.brown@harvard.edu', 'James Brown'),
  ('lisa.kim@mit.edu', 'Lisa Kim'),
  ('david.lee@uw.edu', 'David Lee'),
  ('sophia.martinez@uw.edu', 'Sophia Martinez'),
  ('ryan.taylor@utexas.edu', 'Ryan Taylor'),
  ('olivia.garcia@utexas.edu', 'Olivia Garcia'),
  ('ethan.white@gatech.edu', 'Ethan White'),
  ('maya.singh@cmu.edu', 'Maya Singh'),
  ('noah.anderson@umich.edu', 'Noah Anderson'),
  ('ava.thomas@ucla.edu', 'Ava Thomas'),
  ('lucas.moore@ucla.edu', 'Lucas Moore'),
  ('jordan.clark@stanford.edu', 'Jordan Clark'),
  ('mia.harris@mit.edu', 'Mia Harris'),
  ('william.jackson@stanford.edu', 'William Jackson'),
  ('isabella.martin@berkeley.edu', 'Isabella Martin')
) AS t(email, full_name);

-- ===================================
-- STEP 2: Create users in merged table
-- ===================================

-- San Francisco Bay Area Users
INSERT INTO users (
  id, email, full_name, institution_id, grad_year,
  city, state, country, latitude, longitude,
  status, employer, job_title, bio, linkedin_url,
  looking_for_roommate, roommate_budget_min, roommate_budget_max,
  onboarding_completed, email_verified, profile_visible,
  show_employer, show_school, last_location_update
)
VALUES
  -- Sarah Chen - Employed, SF, Looking for roommate
  (
    (SELECT id FROM auth.users WHERE email = 'sarah.chen@stanford.edu'),
    'sarah.chen@stanford.edu',
    'Sarah Chen',
    (SELECT id FROM institutions WHERE domain = 'stanford.edu'),
    2023,
    'San Francisco', 'CA', 'United States', 37.7749, -122.4194,
    'employed', 'Google', 'Software Engineer',
    'Stanford CS grad working at Google. Love hiking, coffee, and building cool products. Always down to connect with fellow alumni!',
    'https://linkedin.com/in/sarah-chen',
    true, 1500, 2500,
    true, true, true,
    true, true, NOW() - INTERVAL '45 days'  -- Location set 45 days ago, can update
  ),
  
  -- Mike Johnson - Employed, Palo Alto (hides employer)
  (
    (SELECT id FROM auth.users WHERE email = 'mike.johnson@stanford.edu'),
    'mike.johnson@stanford.edu',
    'Mike Johnson',
    (SELECT id FROM institutions WHERE domain = 'stanford.edu'),
    2022,
    'Palo Alto', 'CA', 'United States', 37.4419, -122.1430,
    'employed', 'Meta', 'Product Manager',
    'Product manager at Meta. Stanford GSB alum. Passionate about building products that scale.',
    'https://linkedin.com/in/mike-johnson',
    false, NULL, NULL,
    true, true, true,
    false, true, NOW() - INTERVAL '60 days'  -- Hides employer
  ),
  
  -- Priya Patel - Grad School, Berkeley, Looking for roommate (hides school)
  (
    (SELECT id FROM auth.users WHERE email = 'priya.patel@berkeley.edu'),
    'priya.patel@berkeley.edu',
    'Priya Patel',
    (SELECT id FROM institutions WHERE domain = 'berkeley.edu'),
    2023,
    'Berkeley', 'CA', 'United States', 37.8715, -122.2730,
    'grad_school', NULL, NULL,
    'PhD student in Computer Science. Researching ML and NLP. Always excited to meet fellow researchers and alumni!',
    'https://linkedin.com/in/priya-patel',
    true, 1200, 2000,
    true, true, true,
    true, false, NOW() - INTERVAL '10 days'  -- Hides school name, can't update location for 20 more days
  ),
  
  -- Alex Rodriguez - Looking for work, San Jose
  (
    (SELECT id FROM auth.users WHERE email = 'alex.rodriguez@stanford.edu'),
    'alex.rodriguez@stanford.edu',
    'Alex Rodriguez',
    (SELECT id FROM institutions WHERE domain = 'stanford.edu'),
    2024,
    'San Jose', 'CA', 'United States', 37.3382, -121.8863,
    'looking', NULL, NULL,
    'Recent Stanford grad exploring opportunities in tech. Interested in AI/ML and product roles.',
    'https://linkedin.com/in/alex-rodriguez',
    true, 1000, 1800,
    true, true, true,
    true, true, NOW() - INTERVAL '5 days'  -- Recent location update, locked for 25 more days
  ),

-- Boston Area Users
  (
    (SELECT id FROM auth.users WHERE email = 'emma.wilson@mit.edu'),
    'emma.wilson@mit.edu',
    'Emma Wilson',
    (SELECT id FROM institutions WHERE domain = 'mit.edu'),
    2022,
    'Cambridge', 'MA', 'United States', 42.3736, -71.1097,
    'employed', 'Stripe', 'Data Scientist',
    'MIT EECS grad. Data scientist at Stripe. Love running, reading, and finding the best ramen spots in Cambridge.',
    'https://linkedin.com/in/emma-wilson',
    false, NULL, NULL,
    true, true, true,
    true, true, NOW() - INTERVAL '50 days'
  ),
  
  (
    (SELECT id FROM auth.users WHERE email = 'james.brown@harvard.edu'),
    'james.brown@harvard.edu',
    'James Brown',
    (SELECT id FROM institutions WHERE domain = 'harvard.edu'),
    2023,
    'Boston', 'MA', 'United States', 42.3601, -71.0589,
    'employed', 'McKinsey', 'Management Consultant',
    'Harvard MBA. Management consultant helping companies transform. Fitness enthusiast and coffee snob.',
    'https://linkedin.com/in/james-brown',
    false, NULL, NULL,
    true, true, true,
    true, true, NOW() - INTERVAL '40 days'
  ),
  
  (
    (SELECT id FROM auth.users WHERE email = 'lisa.kim@mit.edu'),
    'lisa.kim@mit.edu',
    'Lisa Kim',
    (SELECT id FROM institutions WHERE domain = 'mit.edu'),
    2024,
    'Somerville', 'MA', 'United States', 42.3876, -71.0995,
    'grad_school', NULL, NULL,
    'MBA candidate at MIT Sloan. Former software engineer. Passionate about startups and innovation.',
    'https://linkedin.com/in/lisa-kim',
    false, NULL, NULL,
    true, true, true,
    true, true, NOW() - INTERVAL '35 days'
  ),

-- Seattle Area Users  
  (
    (SELECT id FROM auth.users WHERE email = 'david.lee@uw.edu'),
    'david.lee@uw.edu',
    'David Lee',
    (SELECT id FROM institutions WHERE domain = 'uw.edu'),
    2023,
    'Seattle', 'WA', 'United States', 47.6062, -122.3321,
    'employed', 'Amazon', 'Software Development Engineer',
    'UW CS grad working at Amazon. Love hiking, board games, and exploring Seattle food scene.',
    'https://linkedin.com/in/david-lee',
    true, 2000, 3000,
    true, true, true,
    true, true, NOW() - INTERVAL '15 days'  -- Recent, locked for 15 more days
  ),
  
  (
    (SELECT id FROM auth.users WHERE email = 'sophia.martinez@uw.edu'),
    'sophia.martinez@uw.edu',
    'Sophia Martinez',
    (SELECT id FROM institutions WHERE domain = 'uw.edu'),
    2022,
    'Bellevue', 'WA', 'United States', 47.6101, -122.2015,
    'employed', 'Microsoft', 'Program Manager',
    'Program manager at Microsoft. UW Foster alum. Love travel, photography, and connecting with fellow Huskies.',
    'https://linkedin.com/in/sophia-martinez',
    false, NULL, NULL,
    true, true, true,
    true, true, NOW() - INTERVAL '55 days'
  ),

-- Austin Area Users
  (
    (SELECT id FROM auth.users WHERE email = 'ryan.taylor@utexas.edu'),
    'ryan.taylor@utexas.edu',
    'Ryan Taylor',
    (SELECT id FROM institutions WHERE domain = 'utexas.edu'),
    2023,
    'Austin', 'TX', 'United States', 30.2672, -97.7431,
    'looking', NULL, NULL,
    'UT Austin grad looking for opportunities in tech. Interested in product management and startups. Hook ''em!',
    'https://linkedin.com/in/ryan-taylor',
    true, 1200, 2000,
    true, true, true,
    true, true, NOW() - INTERVAL '60 days'
  ),
  
  (
    (SELECT id FROM auth.users WHERE email = 'olivia.garcia@utexas.edu'),
    'olivia.garcia@utexas.edu',
    'Olivia Garcia',
    (SELECT id FROM institutions WHERE domain = 'utexas.edu'),
    2024,
    'Austin', 'TX', 'United States', 30.3072, -97.7559,
    'looking', NULL, NULL,
    'Recent UT grad. Exploring roles in consulting and tech. Love live music, tacos, and the Austin vibe!',
    'https://linkedin.com/in/olivia-garcia',
    true, 1000, 1800,
    true, true, true,
    true, true, NOW() - INTERVAL '60 days'
  ),

-- Other Cities
  (
    (SELECT id FROM auth.users WHERE email = 'ethan.white@gatech.edu'),
    'ethan.white@gatech.edu',
    'Ethan White',
    (SELECT id FROM institutions WHERE domain = 'gatech.edu'),
    2022,
    'Atlanta', 'GA', 'United States', 33.7490, -84.3880,
    'grad_school', NULL, NULL,
    'Mechanical Engineering MS at Georgia Tech. Former aerospace engineer. Love robotics and making things.',
    'https://linkedin.com/in/ethan-white',
    false, NULL, NULL,
    true, true, true,
    true, true, NOW() - INTERVAL '60 days'
  ),
  
  (
    (SELECT id FROM auth.users WHERE email = 'maya.singh@cmu.edu'),
    'maya.singh@cmu.edu',
    'Maya Singh',
    (SELECT id FROM institutions WHERE domain = 'cmu.edu'),
    2023,
    'Pittsburgh', 'PA', 'United States', 40.4406, -79.9959,
    'grad_school', NULL, NULL,
    'Machine Learning PhD at CMU. Researching computer vision. Love art, museums, and Pittsburgh bridges.',
    'https://linkedin.com/in/maya-singh',
    true, 1400, 2200,
    true, true, true,
    true, true, NOW() - INTERVAL '60 days'
  ),
  
  (
    (SELECT id FROM auth.users WHERE email = 'noah.anderson@umich.edu'),
    'noah.anderson@umich.edu',
    'Noah Anderson',
    (SELECT id FROM institutions WHERE domain = 'umich.edu'),
    2024,
    'Ann Arbor', 'MI', 'United States', 42.2808, -83.7430,
    'looking', NULL, NULL,
    'Recent Michigan grad. Exploring opportunities in finance and consulting. Go Blue!',
    'https://linkedin.com/in/noah-anderson',
    true, 1000, 1800,
    true, true, true,
    true, true, NOW() - INTERVAL '60 days'
  ),

-- LA Area Users
  (
    (SELECT id FROM auth.users WHERE email = 'ava.thomas@ucla.edu'),
    'ava.thomas@ucla.edu',
    'Ava Thomas',
    (SELECT id FROM institutions WHERE domain = 'ucla.edu'),
    2023,
    'Los Angeles', 'CA', 'United States', 34.0522, -118.2437,
    'looking', NULL, NULL,
    'UCLA grad looking for opportunities in entertainment and media. Love film, beaches, and exploring LA.',
    'https://linkedin.com/in/ava-thomas',
    true, 1500, 2500,
    true, true, true,
    true, true, NOW() - INTERVAL '60 days'
  ),
  
  (
    (SELECT id FROM auth.users WHERE email = 'lucas.moore@ucla.edu'),
    'lucas.moore@ucla.edu',
    'Lucas Moore',
    (SELECT id FROM institutions WHERE domain = 'ucla.edu'),
    2022,
    'Santa Monica', 'CA', 'United States', 34.0195, -118.4912,
    'employed', 'Netflix', 'UI/UX Designer',
    'UI/UX designer at Netflix. UCLA Design grad. Love surfing, design, and good coffee.',
    'https://linkedin.com/in/lucas-moore',
    true, 1800, 2800,
    true, true, true,
    true, true, NOW() - INTERVAL '60 days'
  ),

-- Users still onboarding
  (
    (SELECT id FROM auth.users WHERE email = 'jordan.clark@stanford.edu'),
    'jordan.clark@stanford.edu',
    'Jordan Clark',
    (SELECT id FROM institutions WHERE domain = 'stanford.edu'),
    2024,
    'Mountain View', 'CA', 'United States', 37.3861, -122.0839,
    NULL, NULL, NULL,
    NULL, NULL,
    false, NULL, NULL,
    false, true, true,
    true, true, NULL  -- show_employer, show_school, last_location_update
  ),
  
  (
    (SELECT id FROM auth.users WHERE email = 'mia.harris@mit.edu'),
    'mia.harris@mit.edu',
    'Mia Harris',
    (SELECT id FROM institutions WHERE domain = 'mit.edu'),
    2023,
    NULL, NULL, 'United States', NULL, NULL,
    NULL, NULL, NULL,
    NULL, NULL,
    false, NULL, NULL,
    false, true, true,
    true, true, NULL  -- show_employer, show_school, last_location_update
  ),

-- Users in same institution but different locations
  (
    (SELECT id FROM auth.users WHERE email = 'william.jackson@stanford.edu'),
    'william.jackson@stanford.edu',
    'William Jackson',
    (SELECT id FROM institutions WHERE domain = 'stanford.edu'),
    2022,
    'New York', 'NY', 'United States', 40.7128, -74.0060,
    'employed', 'Goldman Sachs', 'Investment Analyst',
    'Stanford grad working in finance in NYC. Love the city life, jazz, and trying new restaurants.',
    'https://linkedin.com/in/william-jackson',
    false, NULL, NULL,
    true, true, true,
    true, true, NOW() - INTERVAL '60 days'
  ),
  
  (
    (SELECT id FROM auth.users WHERE email = 'isabella.martin@berkeley.edu'),
    'isabella.martin@berkeley.edu',
    'Isabella Martin',
    (SELECT id FROM institutions WHERE domain = 'berkeley.edu'),
    2023,
    'Denver', 'CO', 'United States', 39.7392, -104.9903,
    'looking', NULL, NULL,
    'Berkeley grad exploring opportunities in sustainability and cleantech. Love hiking, skiing, and the mountains.',
    'https://linkedin.com/in/isabella-martin',
    true, 1200, 2000,
    true, true, true,
    true, true, NOW() - INTERVAL '70 days'
  );

-- Update program/degree for grad school users (manual update since it's in the merged table)
UPDATE users SET program = 'Computer Science PhD', degree = 'PhD' 
WHERE email = 'priya.patel@berkeley.edu';

UPDATE users SET program = 'MBA', degree = 'MBA'
WHERE email = 'lisa.kim@mit.edu';

UPDATE users SET program = 'Mechanical Engineering MS', degree = 'MS'
WHERE email = 'ethan.white@gatech.edu';

UPDATE users SET program = 'Machine Learning PhD', degree = 'PhD'
WHERE email = 'maya.singh@cmu.edu';

-- ===================================
-- STEP 3: SUMMARY QUERIES
-- ===================================

-- Show created users
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as onboarded_users,
  COUNT(*) FILTER (WHERE onboarding_completed = false) as pending_onboarding
FROM users;

-- Show users by institution
SELECT 
  i.name as institution,
  COUNT(u.id) as user_count
FROM users u
LEFT JOIN institutions i ON u.institution_id = i.id
GROUP BY i.name
ORDER BY user_count DESC;

-- Show users by location
SELECT 
  city,
  state,
  COUNT(*) as user_count
FROM users
WHERE city IS NOT NULL
GROUP BY city, state
ORDER BY user_count DESC;

-- Show profile distribution
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE looking_for_roommate = true) as looking_for_roommate
FROM users
WHERE status IS NOT NULL
GROUP BY status;

-- Show profile completeness stats
SELECT 
  ROUND(AVG(profile_completeness), 2) as avg_completeness,
  MIN(profile_completeness) as min_completeness,
  MAX(profile_completeness) as max_completeness,
  COUNT(*) FILTER (WHERE profile_completeness >= 80) as highly_complete_profiles
FROM users
WHERE onboarding_completed = true;

