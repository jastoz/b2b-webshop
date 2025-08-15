/**
 * Script to add role column to customer_users table
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function addRoleColumn() {
  console.log('🔧 Adding role column to customer_users table...');
  
  try {
    // First, let's check the current structure
    const { data: existingStructure, error: structureError } = await supabase
      .from('customer_users')
      .select('*')
      .limit(1);
      
    if (structureError) {
      console.error('❌ Error checking table structure:', structureError);
      return;
    }
    
    console.log('📋 Current table structure sample:', existingStructure[0] ? Object.keys(existingStructure[0]) : 'No data');
    
    console.log('⚠️  Note: You need to run the following SQL commands in Supabase SQL Editor:');
    console.log(`
-- 1. Create role enum type
CREATE TYPE user_role AS ENUM ('admin', 'customer');

-- 2. Add role column with default 'customer' 
ALTER TABLE customer_users 
ADD COLUMN role user_role DEFAULT 'customer';

-- 3. Create index for performance
CREATE INDEX idx_customer_users_role ON customer_users(role);

-- 4. Set some users as admin (example)
UPDATE customer_users 
SET role = 'admin' 
WHERE email IN ('admin@test.hr', 'hotel-medena-seget-d@test.hr');
    `);
    
    console.log('📋 After running the SQL, this script will verify the changes...');
    
    // Instead of trying to execute SQL, let's try to verify if column exists
    const { data, error } = await supabase
      .from('customer_users')  
      .select('id, email, role')
      .limit(1);
    
    if (error) {
      console.error('❌ Error adding role column:', error);
      return;
    }
    
    console.log('✅ Successfully added role column to customer_users table');
    console.log('📊 Result:', data);
    
    // Verify the addition
    const { data: verification, error: verifyError } = await supabase
      .from('customer_users')
      .select('id, email, role')
      .limit(5);
      
    if (verifyError) {
      console.error('❌ Error verifying role column:', verifyError);
    } else {
      console.log('🔍 Verification - sample records with roles:', verification);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the migration
addRoleColumn();