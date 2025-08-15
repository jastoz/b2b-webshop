import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAuthUsers() {
  console.log('🔐 Creating Supabase Auth users...\n');

  // Get customer_users from database
  const { data: customerUsers, error } = await supabase
    .from('customer_users')
    .select(`
      email,
      full_name,
      customer_id,
      customers (name)
    `)
    .eq('is_active', true)
    .limit(10); // Start with first 10 users for testing

  if (error) {
    console.error('❌ Failed to get customer_users:', error);
    return;
  }

  console.log(`📋 Found ${customerUsers.length} active users to create`);
  
  const results = [];
  const password = 'test123'; // Default password for all test users

  for (let i = 0; i < customerUsers.length; i++) {
    const user = customerUsers[i];
    console.log(`\n${i + 1}. Creating user: ${user.email}`);
    console.log(`   Customer: ${user.customers.name}`);

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: password,
        email_confirm: true, // Skip email verification for test users
        user_metadata: {
          full_name: user.full_name,
          customer_id: user.customer_id,
          customer_name: user.customers.name
        }
      });

      if (authError) {
        console.log(`   ❌ Failed: ${authError.message}`);
        results.push({
          email: user.email,
          status: 'failed',
          error: authError.message
        });
      } else {
        console.log(`   ✅ Created Auth user: ${authData.user.id}`);
        results.push({
          email: user.email,
          status: 'success',
          auth_id: authData.user.id
        });
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      results.push({
        email: user.email,
        status: 'error',
        error: err.message
      });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status !== 'success');

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\n🔑 Test Login Credentials:');
    console.log('Email: any of the created emails above');
    console.log('Password: test123');
    console.log('\nExample:');
    console.log(`Email: ${successful[0].email}`);
    console.log('Password: test123');
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed users:');
    failed.forEach(f => {
      console.log(`   ${f.email}: ${f.error}`);
    });
  }
}

// Check environment
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

createAuthUsers().catch(console.error);