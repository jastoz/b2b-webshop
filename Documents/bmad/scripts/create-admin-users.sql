-- SQL script to run in Supabase SQL Editor for RBAC implementation

-- 1. Create role enum type
CREATE TYPE user_role AS ENUM ('admin', 'customer');

-- 2. Add role column with default 'customer' 
ALTER TABLE customer_users 
ADD COLUMN role user_role DEFAULT 'customer';

-- 3. Create index for performance
CREATE INDEX idx_customer_users_role ON customer_users(role);

-- 4. Create dedicated admin user (not linked to any customer)
INSERT INTO customer_users (customer_id, email, full_name, is_primary, is_active, role)
VALUES 
  (NULL, 'admin@bmad.hr', 'BMAD Administrator', true, true, 'admin'),
  (NULL, 'admin@test.hr', 'Test Administrator', true, true, 'admin');

-- 5. Set existing hotel user as admin for testing
UPDATE customer_users 
SET role = 'admin' 
WHERE email = 'hotel-medena-seget-d@test.hr';

-- 6. Verify the changes
SELECT 
  id, 
  customer_id, 
  email, 
  full_name, 
  role,
  is_primary,
  is_active 
FROM customer_users 
WHERE role = 'admin'
ORDER BY created_at;

-- 7. Show statistics
SELECT 
  role,
  COUNT(*) as count
FROM customer_users 
GROUP BY role;