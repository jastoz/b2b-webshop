# Create Admin Users in Supabase

## Step 1: Create Admin Users in Supabase Auth

Go to your Supabase project dashboard → Authentication → Users and create these admin users:

### Admin User 1:
- **Email**: `admin@bmad.hr`
- **Password**: `Admin123!` (change this after first login)
- **Confirm email**: ✅ (check this box)

### Admin User 2:
- **Email**: `admin@test.hr` 
- **Password**: `Admin123!` (change this after first login)
- **Confirm email**: ✅ (check this box)

## Step 2: Add Admin Users to customer_users Table

After creating the users in Supabase Auth, run these SQL commands in the SQL Editor:

```sql
-- 4. Create dedicated admin user records (not linked to any customer)
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
```

## Step 3: Test the System

1. **Admin Login**: Try logging in with `admin@bmad.hr` or `admin@test.hr`
   - Should redirect to `/customer-select` page
   - Should see all customers in the list

2. **Customer Login**: Try logging in with `hotel-medena-seget-d@test.hr` 
   - Should now work as admin (if the UPDATE command worked)
   - Or use any regular customer email to test customer role

3. **Role-based Access**: 
   - Admins can access `/customer-select` and any customer catalog
   - Customers can only access their own catalog `/katalog/{their-customer-id}`