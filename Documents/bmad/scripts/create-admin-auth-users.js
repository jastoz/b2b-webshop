/**
 * Script to create admin users in Supabase Auth
 * Run this after running the SQL script in Supabase dashboard
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

const adminUsers = [
  {
    email: 'admin@bmad.hr',
    password: 'admin123',
    full_name: 'BMAD Administrator',
    customer_id: null
  },
  {
    email: 'admin@test.hr', 
    password: 'admin123',
    full_name: 'Test Administrator',
    customer_id: null
  }
];

async function createAdminAuthUsers() {
  console.log('👤 Creating admin users in Supabase Auth...');
  
  for (const user of adminUsers) {
    try {
      console.log(`📧 Creating user: ${user.email}`);
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: 'admin',
          customer_id: user.customer_id
        }
      });
      
      if (authError) {
        console.error(`❌ Error creating auth user for ${user.email}:`, authError.message);
        continue;
      }
      
      console.log(`✅ Created auth user: ${user.email} (ID: ${authData.user.id})`);
      
      // Wait a bit between creations
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`💥 Unexpected error creating ${user.email}:`, error);
    }
  }
  
  console.log('\n🔍 Verifying admin users in customer_users table...');
  
  try {
    const { data: adminUsersData, error } = await supabase
      .from('customer_users')
      .select('id, email, full_name, role, customer_id')
      .eq('role', 'admin');
      
    if (error) {
      console.error('❌ Error fetching admin users:', error);
    } else {
      console.log('📋 Admin users in database:');
      console.table(adminUsersData);
    }
  } catch (error) {
    console.error('💥 Error verifying admin users:', error);
  }
}

// Run the script
createAdminAuthUsers();