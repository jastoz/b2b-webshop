/**
 * Simple script to add only customer_users to existing Supabase database
 * CommonJS version to avoid ES6 import issues
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

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

// Load customer users data
const loadCustomerUsers = () => {
  const customerUsersPath = path.join(process.cwd(), 'data', 'test-customer-users.json');
  
  if (!fs.existsSync(customerUsersPath)) {
    throw new Error('test-customer-users.json not found. Run: node scripts/generate-test-users.js');
  }
  
  const customerUsersData = JSON.parse(fs.readFileSync(customerUsersPath, 'utf-8'));
  return customerUsersData.data || [];
};

// Transform customer users for database insert
const transformCustomerUsers = (customerUsers) => {
  return customerUsers.map(user => ({
    customer_id: user.customer_id,
    email: user.email.toLowerCase(),
    full_name: user.full_name,
    is_primary: user.is_primary,
    is_active: user.is_active
  }));
};

// Insert data with error handling
const insertCustomerUsers = async (customerUsers) => {
  console.log(`📊 Inserting ${customerUsers.length} customer users...`);
  
  const batchSize = 25; // Smaller batches to avoid timeout
  let totalInserted = 0;
  let totalSkipped = 0;

  for (let i = 0; i < customerUsers.length; i += batchSize) {
    const batch = customerUsers.slice(i, i + batchSize);
    const batchNumber = Math.floor(i/batchSize) + 1;
    
    console.log(`📦 Processing batch ${batchNumber}/${Math.ceil(customerUsers.length/batchSize)} (${batch.length} users)...`);
    
    const { data: insertedUsers, error: insertError } = await supabase
      .from('customer_users')
      .upsert(batch, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select();

    if (insertError) {
      console.log(`   ❌ Batch ${batchNumber} failed:`, insertError.message);
      
      // Try individual inserts for this batch
      console.log(`   🔄 Trying individual inserts for batch ${batchNumber}...`);
      for (const user of batch) {
        const { data: singleUser, error: singleError } = await supabase
          .from('customer_users')
          .upsert([user], { 
            onConflict: 'email',
            ignoreDuplicates: false 
          })
          .select();
        
        if (singleError) {
          if (singleError.code === '23503') {
            console.log(`      ⚠️  ${user.email}: Customer ${user.customer_id} not found (skipping)`);
          } else {
            console.log(`      ❌ ${user.email}: ${singleError.message}`);
          }
          totalSkipped++;
        } else if (singleUser && singleUser.length > 0) {
          totalInserted++;
        } else {
          totalSkipped++; // Duplicate
        }
      }
    } else {
      const inserted = insertedUsers ? insertedUsers.length : 0;
      totalInserted += inserted;
      totalSkipped += (batch.length - inserted);
      console.log(`   ✅ Batch ${batchNumber}: ${inserted} inserted, ${batch.length - inserted} skipped`);
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { totalInserted, totalSkipped };
};

// Validate and show sample data
const validateAndShowResults = async () => {
  console.log('\n🔍 Validating customer_users...');
  
  // Count total records
  const { count, error } = await supabase
    .from('customer_users')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.log('❌ Error counting customer_users:', error.message);
    return;
  }
  
  console.log(`✅ Total customer_users: ${count}`);
  
  // Count by type
  const { data: primaryData, count: primaryCount } = await supabase
    .from('customer_users')
    .select('*', { count: 'exact', head: true })
    .eq('is_primary', true);
  
  const { data: additionalData, count: additionalCount } = await supabase
    .from('customer_users')
    .select('*', { count: 'exact', head: true })
    .eq('is_primary', false);

  console.log(`   👑 Primary contacts: ${primaryCount || 0}`);
  console.log(`   👥 Additional users: ${additionalCount || 0}`);
  
  // Show sample data with customer names
  const { data: sampleUsers } = await supabase
    .from('customer_users')
    .select(`
      email,
      full_name,
      is_primary,
      customer_id,
      customers (customer_name)
    `)
    .limit(5);

  if (sampleUsers && sampleUsers.length > 0) {
    console.log('\n👥 Sample customer_users data:');
    sampleUsers.forEach(user => {
      const primary = user.is_primary ? ' 👑' : '';
      const customerName = user.customers?.customer_name || `Customer ${user.customer_id}`;
      console.log(`   📧 ${user.email}${primary}`);
      console.log(`      → ${customerName}`);
    });
  }
};

// Main function
const addCustomerUsers = async () => {
  try {
    console.log('🔐 Adding customer_users to Supabase...\n');
    
    // Step 1: Check if table exists
    console.log('1️⃣ Checking customer_users table...');
    const { data: tableCheck, error: tableError, count } = await supabase
      .from('customer_users')
      .select('*', { count: 'exact', head: true });

    if (tableError) {
      console.log('❌ customer_users table not found:', tableError.message);
      console.log('\n📝 Please create the table first:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/qjtkvvmvbbisrdbsxmuk/sql');
      console.log('   2. Run SQL from: /supabase/create-customer-users-table-only.sql');
      return { success: false, needsTable: true };
    }

    console.log(`✅ Table exists with ${count} existing records`);
    
    // Step 2: Load customer users
    console.log('\n2️⃣ Loading customer users data...');
    const customerUsers = loadCustomerUsers();
    console.log(`📧 Loaded ${customerUsers.length} customer users`);
    
    // Step 3: Transform data
    console.log('\n3️⃣ Transforming data...');
    const transformedUsers = transformCustomerUsers(customerUsers);
    console.log(`✅ Prepared ${transformedUsers.length} records`);
    
    // Step 4: Insert data
    console.log('\n4️⃣ Inserting customer users...');
    const { totalInserted, totalSkipped } = await insertCustomerUsers(transformedUsers);
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Inserted: ${totalInserted} users`);
    console.log(`   ⏭️  Skipped: ${totalSkipped} users (duplicates or invalid customer_id)`);
    
    // Step 5: Validate results
    await validateAndShowResults();
    
    return {
      success: true,
      totalInserted,
      totalSkipped
    };
    
  } catch (error) {
    console.error('\n💥 Failed to add customer_users:', error.message);
    return { success: false, error: error.message };
  }
};

// Run the script
if (require.main === module) {
  addCustomerUsers()
    .then(result => {
      console.log('\n' + '='.repeat(50));
      if (result.success) {
        console.log('🎉 Customer_users setup completed!');
        console.log('\n🔗 Next steps:');
        console.log('   1. Test login at /login');
        console.log('   2. Test admin panel at /admin/customer-users'); 
        console.log('   3. Check sample logins at /data/sample-logins.json');
        console.log('\n📧 Sample login:');
        console.log('   Email: hotel-medena-seget-d@test.hr');
        console.log('   Password: test123');
      } else if (result.needsTable) {
        console.log('📝 Please create customer_users table first');
      } else {
        console.log('❌ Setup failed');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('💥 Script error:', err);
      process.exit(1);
    });
}

module.exports = { addCustomerUsers };