-- Seed script for Boston College Users
-- Date: 2025-11-09
-- Description: Creates 15 diverse test users from Boston College (@bc.edu)
-- Based on: seed_v3_test_users.sql
-- Includes: Privacy controls (show_school, show_employer), 30-day location lock, profile_visible always true

-- ⚠️ IMPORTANT: Run this AFTER seed_v3_test_users.sql
-- This adds 15 BC users to the existing database

-- ===================================
-- STEP 0: Clean up existing BC users (if any)
-- ===================================

-- Delete test BC users from auth.users if they exist
DELETE FROM auth.users WHERE email IN (
  'thomas.murphy@bc.edu',
  'katherine.oshea@bc.edu',
  'brian.sullivan@bc.edu',
  'maria.gonzalez@bc.edu',
  'patrick.fitzgerald@bc.edu',
  'rachel.cohen@bc.edu',
  'michael.lynch@bc.edu',
  'emily.nguyen@bc.edu',
  'daniel.reilly@bc.edu',
  'jessica.thompson@bc.edu',
  'kevin.brennan@bc.edu',
  'amanda.clarke@bc.edu',
  'sean.donoghue@bc.edu',
  'lauren.martinez@bc.edu',
  'christopher.walsh@bc.edu'
);

-- ===================================
-- STEP 1: Ensure BC institution exists
-- ===================================

INSERT INTO institutions (name, domain, website)
VALUES ('Boston College', 'bc.edu', 'https://www.bc.edu')
ON CONFLICT (domain) DO NOTHING;

-- ===================================
-- STEP 2: Create test auth users
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
  ('thomas.murphy@bc.edu', 'Thomas Murphy'),
  ('katherine.oshea@bc.edu', 'Katherine O''Shea'),
  ('brian.sullivan@bc.edu', 'Brian Sullivan'),
  ('maria.gonzalez@bc.edu', 'Maria Gonzalez'),
  ('patrick.fitzgerald@bc.edu', 'Patrick Fitzgerald'),
  ('rachel.cohen@bc.edu', 'Rachel Cohen'),
  ('michael.lynch@bc.edu', 'Michael Lynch'),
  ('emily.nguyen@bc.edu', 'Emily Nguyen'),
  ('daniel.reilly@bc.edu', 'Daniel Reilly'),
  ('jessica.thompson@bc.edu', 'Jessica Thompson'),
  ('kevin.brennan@bc.edu', 'Kevin Brennan'),
  ('amanda.clarke@bc.edu', 'Amanda Clarke'),
  ('sean.donoghue@bc.edu', 'Sean Donoghue'),
  ('lauren.martinez@bc.edu', 'Lauren Martinez'),
  ('christopher.walsh@bc.edu', 'Christopher Walsh')
) AS t(email, full_name);

-- ===================================
-- STEP 3: Create users in merged table
-- ===================================

-- Boston Area BC Users (close to campus)
INSERT INTO users (
  id, email, personal_email, full_name, institution_id, grad_year,
  city, state, country, latitude, longitude,
  status, employer, job_title, grad_school, bio, linkedin_url,
  looking_for_roommate, roommate_budget_min, roommate_budget_max,
  onboarding_completed, email_verified, profile_visible,
  show_employer, show_school, last_location_update
)
VALUES
  -- Thomas Murphy - Employed, Boston Financial District
  (
    (SELECT id FROM auth.users WHERE email = 'thomas.murphy@bc.edu'),
    'thomas.murphy@bc.edu',
    'thomas.murphy.finance@gmail.com',
    'Thomas Murphy',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2022,
    'Boston', 'MA', 'United States', 42.3554, -71.0640,
    'employed', 'Fidelity Investments', 'Financial Analyst', NULL,
    'BC Carroll School of Management grad. Financial analyst at Fidelity. Love Red Sox games, running the Charles, and BC football. Go Eagles!',
    'https://linkedin.com/in/thomas-murphy',
    true, 1800, 2800,
    true, true, true,
    true, true, NOW() - INTERVAL '50 days'
  ),
  
  -- Katherine O'Shea - Grad School at BC Law, looking for roommate
  (
    (SELECT id FROM auth.users WHERE email = 'katherine.oshea@bc.edu'),
    'katherine.oshea@bc.edu',
    'katherine.oshea.law@gmail.com',
    'Katherine O''Shea',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2023,
    'Brookline', 'MA', 'United States', 42.3317, -71.1211,
    'grad_school', NULL, NULL, 'Boston College Law School',
    'BC Law student pursuing JD. Former paralegal. Passionate about public interest law and social justice.',
    'https://linkedin.com/in/katherine-oshea',
    true, 1500, 2500,
    true, true, true,
    true, true, NOW() - INTERVAL '45 days'
  ),
  
  -- Brian Sullivan - Employed in Tech, Cambridge
  (
    (SELECT id FROM auth.users WHERE email = 'brian.sullivan@bc.edu'),
    'brian.sullivan@bc.edu',
    'brian.sullivan.dev@gmail.com',
    'Brian Sullivan',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2021,
    'Cambridge', 'MA', 'United States', 42.3736, -71.1097,
    'employed', 'HubSpot', 'Software Engineer', NULL,
    'BC CS grad working at HubSpot. Love building products, craft beer, and hiking in the White Mountains.',
    'https://linkedin.com/in/brian-sullivan',
    false, NULL, NULL,
    true, true, true,
    true, true, NOW() - INTERVAL '60 days'
  ),
  
  -- Maria Gonzalez - Internship, Boston (hides employer)
  (
    (SELECT id FROM auth.users WHERE email = 'maria.gonzalez@bc.edu'),
    'maria.gonzalez@bc.edu',
    'maria.g.intern@gmail.com',
    'Maria Gonzalez',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2025,
    'Boston', 'MA', 'United States', 42.3601, -71.0589,
    'internship', 'Boston Consulting Group', 'Summer Associate', NULL,
    'BC junior interning at BCG. Studying Economics and Computer Science. Love salsa dancing and exploring Boston.',
    'https://linkedin.com/in/maria-gonzalez',
    true, 1400, 2200,
    true, true, true,
    false, true, NOW() - INTERVAL '8 days'  -- Hides employer, location locked
  ),
  
  -- Patrick Fitzgerald - Looking, Somerville
  (
    (SELECT id FROM auth.users WHERE email = 'patrick.fitzgerald@bc.edu'),
    'patrick.fitzgerald@bc.edu',
    'patrick.fitz.career@gmail.com',
    'Patrick Fitzgerald',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2024,
    'Somerville', 'MA', 'United States', 42.3876, -71.0995,
    'looking', NULL, NULL, NULL,
    'Recent BC grad exploring opportunities in marketing and communications. Love live music, coffee shops, and BC hockey!',
    'https://linkedin.com/in/patrick-fitzgerald',
    true, 1300, 2100,
    true, true, true,
    true, true, NOW() - INTERVAL '60 days'
  ),
  
  -- Rachel Cohen - Employed in Healthcare, Boston
  (
    (SELECT id FROM auth.users WHERE email = 'rachel.cohen@bc.edu'),
    'rachel.cohen@bc.edu',
    'rachel.cohen.health@gmail.com',
    'Rachel Cohen',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2022,
    'Boston', 'MA', 'United States', 42.3488, -71.0768,
    'employed', 'Mass General Brigham', 'Healthcare Consultant', NULL,
    'BC grad working in healthcare consulting at MGH. Passionate about improving patient care and healthcare systems.',
    'https://linkedin.com/in/rachel-cohen',
    false, NULL, NULL,
    true, true, true,
    true, true, NOW() - INTERVAL '55 days'
  ),
  
  -- Michael Lynch - Grad School at BU, lives near BC (hides school)
  (
    (SELECT id FROM auth.users WHERE email = 'michael.lynch@bc.edu'),
    'michael.lynch@bc.edu',
    'michael.lynch.mba@gmail.com',
    'Michael Lynch',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2023,
    'Newton', 'MA', 'United States', 42.3370, -71.2092,
    'grad_school', NULL, NULL, 'Boston University Questrom School of Business',
    'MBA student at BU. BC undergrad. Former account manager. Love networking, startups, and BC basketball.',
    'https://linkedin.com/in/michael-lynch',
    false, NULL, NULL,
    true, true, true,
    true, false, NOW() - INTERVAL '12 days'  -- Hides grad school, location locked
  ),

  -- Emily Nguyen - Employed in Education, Waltham
  (
    (SELECT id FROM auth.users WHERE email = 'emily.nguyen@bc.edu'),
    'emily.nguyen@bc.edu',
    'emily.nguyen.teach@gmail.com',
    'Emily Nguyen',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2023,
    'Waltham', 'MA', 'United States', 42.3765, -71.2356,
    'employed', 'Lynch School of Education (BC)', 'Research Coordinator', NULL,
    'BC Lynch School grad working in educational research. Passionate about equity in education and student success.',
    'https://linkedin.com/in/emily-nguyen',
    true, 1200, 2000,
    true, true, true,
    true, true, NOW() - INTERVAL '40 days'
  ),

-- BC Alumni in Other Cities

  -- Daniel Reilly - Employed in NYC Finance
  (
    (SELECT id FROM auth.users WHERE email = 'daniel.reilly@bc.edu'),
    'daniel.reilly@bc.edu',
    'daniel.reilly.nyc@gmail.com',
    'Daniel Reilly',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2021,
    'New York', 'NY', 'United States', 40.7580, -73.9855,
    'employed', 'JPMorgan Chase', 'Investment Banking Analyst', NULL,
    'BC Carroll School grad in NYC. Investment banking analyst at JPMorgan. Love the fast pace, exploring new restaurants.',
    'https://linkedin.com/in/daniel-reilly',
    false, NULL, NULL,
    true, true, true,
    true, true, NOW() - INTERVAL '60 days'
  ),
  
  -- Jessica Thompson - Employed in DC Policy
  (
    (SELECT id FROM auth.users WHERE email = 'jessica.thompson@bc.edu'),
    'jessica.thompson@bc.edu',
    'jessica.thompson.dc@gmail.com',
    'Jessica Thompson',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2022,
    'Washington', 'DC', 'United States', 38.9072, -77.0369,
    'employed', 'Department of State', 'Foreign Affairs Officer', NULL,
    'BC Political Science grad working in foreign policy. Love traveling, museums, and connecting with BC alumni in DC!',
    'https://linkedin.com/in/jessica-thompson',
    true, 2000, 3000,
    true, true, true,
    true, true, NOW() - INTERVAL '65 days'
  ),
  
  -- Kevin Brennan - Internship in SF Tech
  (
    (SELECT id FROM auth.users WHERE email = 'kevin.brennan@bc.edu'),
    'kevin.brennan@bc.edu',
    'kevin.brennan.pm@gmail.com',
    'Kevin Brennan',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2025,
    'San Francisco', 'CA', 'United States', 37.7749, -122.4194,
    'internship', 'Salesforce', 'Product Management Intern', NULL,
    'BC junior doing summer PM internship at Salesforce. Love tech, surfing, and finding the best clam chowder in SF.',
    'https://linkedin.com/in/kevin-brennan',
    true, 1800, 2800,
    true, true, true,
    true, true, NOW() - INTERVAL '3 days'  -- Very recent location update
  ),
  
  -- Amanda Clarke - Looking, Philadelphia
  (
    (SELECT id FROM auth.users WHERE email = 'amanda.clarke@bc.edu'),
    'amanda.clarke@bc.edu',
    'amanda.clarke.jobs@gmail.com',
    'Amanda Clarke',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2024,
    'Philadelphia', 'PA', 'United States', 39.9526, -75.1652,
    'looking', NULL, NULL, NULL,
    'Recent BC grad exploring opportunities in non-profit and social impact. Love Philly food scene and BC sports!',
    'https://linkedin.com/in/amanda-clarke',
    true, 1100, 1900,
    true, true, true,
    true, true, NOW() - INTERVAL '60 days'
  ),
  
  -- Sean Donoghue - Grad School at Georgetown, DC
  (
    (SELECT id FROM auth.users WHERE email = 'sean.donoghue@bc.edu'),
    'sean.donoghue@bc.edu',
    'sean.donoghue.mpp@gmail.com',
    'Sean Donoghue',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2023,
    'Washington', 'DC', 'United States', 38.9047, -77.0723,
    'grad_school', NULL, NULL, 'Georgetown University',
    'MPP student at Georgetown. BC grad passionate about public policy and social justice. Go Eagles!',
    'https://linkedin.com/in/sean-donoghue',
    true, 1700, 2700,
    true, true, true,
    true, true, NOW() - INTERVAL '35 days'
  ),
  
  -- Lauren Martinez - Employed in Chicago Marketing
  (
    (SELECT id FROM auth.users WHERE email = 'lauren.martinez@bc.edu'),
    'lauren.martinez@bc.edu',
    'lauren.martinez.mkt@gmail.com',
    'Lauren Martinez',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2022,
    'Chicago', 'IL', 'United States', 41.8781, -87.6298,
    'employed', 'Leo Burnett', 'Marketing Associate', NULL,
    'BC Communication grad working in advertising. Love Chicago deep dish, improv comedy, and BC memories!',
    'https://linkedin.com/in/lauren-martinez',
    false, NULL, NULL,
    true, true, true,
    true, true, NOW() - INTERVAL '60 days'
  ),
  
  -- Christopher Walsh - Still onboarding
  (
    (SELECT id FROM auth.users WHERE email = 'christopher.walsh@bc.edu'),
    'christopher.walsh@bc.edu',
    NULL,
    'Christopher Walsh',
    (SELECT id FROM institutions WHERE domain = 'bc.edu'),
    2024,
    'Brighton', 'MA', 'United States', 42.3479, -71.1594,
    NULL, NULL, NULL, NULL,
    NULL, NULL,
    false, NULL, NULL,
    false, true, true,
    true, true, NULL
  );

-- Update program/degree for grad school users
UPDATE users SET program = 'Juris Doctor', degree = 'JD', grad_school = 'Boston College Law School'
WHERE email = 'katherine.oshea@bc.edu';

UPDATE users SET program = 'MBA', degree = 'MBA', grad_school = 'Boston University Questrom School of Business'
WHERE email = 'michael.lynch@bc.edu';

UPDATE users SET program = 'Public Policy', degree = 'MPP', grad_school = 'Georgetown University'
WHERE email = 'sean.donoghue@bc.edu';

-- ===================================
-- STEP 4: SUMMARY QUERIES
-- ===================================

-- Show BC users created
SELECT 
  'Boston College Users' as category,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as onboarded_users,
  COUNT(*) FILTER (WHERE onboarding_completed = false) as pending_onboarding
FROM users
WHERE institution_id = (SELECT id FROM institutions WHERE domain = 'bc.edu');

-- Show BC users by location
SELECT 
  city,
  state,
  COUNT(*) as user_count
FROM users
WHERE institution_id = (SELECT id FROM institutions WHERE domain = 'bc.edu')
  AND city IS NOT NULL
GROUP BY city, state
ORDER BY user_count DESC;

-- Show BC users by status
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE looking_for_roommate = true) as looking_for_roommate
FROM users
WHERE institution_id = (SELECT id FROM institutions WHERE domain = 'bc.edu')
  AND status IS NOT NULL
GROUP BY status;

-- Show all BC users details
SELECT 
  full_name,
  email,
  city || ', ' || state as location,
  status,
  employer,
  grad_school,
  onboarding_completed,
  looking_for_roommate
FROM users
WHERE institution_id = (SELECT id FROM institutions WHERE domain = 'bc.edu')
ORDER BY city, full_name;

-- Overall stats after adding BC users
SELECT 
  'Total Users in Database' as metric,
  COUNT(*) as count
FROM users
UNION ALL
SELECT 
  'Total Institutions',
  COUNT(DISTINCT institution_id)
FROM users
UNION ALL
SELECT
  'BC Users',
  COUNT(*)
FROM users
WHERE institution_id = (SELECT id FROM institutions WHERE domain = 'bc.edu');

