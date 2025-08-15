const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...\n');
    console.log('Project URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Test connection by trying to access customers table
    console.log('📊 Testing existing tables...');
    
    // Try customers table
    try {
      const { data: customers, error: customersError, count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      if (customersError) {
        console.log('   ❌ customers table:', customersError.message);
      } else {
        console.log(`   ✅ customers table: ${count} records`);
      }
    } catch (err) {
      console.log('   ❌ customers table: Not accessible or doesn\'t exist');
    }

    // Try products table  
    try {
      const { data: products, error: productsError, count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      if (productsError) {
        console.log('   ❌ products table:', productsError.message);
      } else {
        console.log(`   ✅ products table: ${count} records`);
      }
    } catch (err) {
      console.log('   ❌ products table: Not accessible or doesn\'t exist');
    }

    // Try customer_products table
    try {
      const { data: customerProducts, error: customerProductsError, count } = await supabase
        .from('customer_products')
        .select('*', { count: 'exact', head: true });
      
      if (customerProductsError) {
        console.log('   ❌ customer_products table:', customerProductsError.message);
      } else {
        console.log(`   ✅ customer_products table: ${count} records`);
      }
    } catch (err) {
      console.log('   ❌ customer_products table: Not accessible or doesn\'t exist');
    }

    // Try customer_users table (should fail - we haven't created it yet)
    try {
      const { data: customerUsers, error: customerUsersError, count } = await supabase
        .from('customer_users')
        .select('*', { count: 'exact', head: true });
      
      if (customerUsersError) {
        console.log('   ❌ customer_users table:', customerUsersError.message);
      } else {
        console.log(`   ✅ customer_users table: ${count} records`);
      }
    } catch (err) {
      console.log('   ❌ customer_users table: Not accessible or doesn\'t exist (expected)');
    }

    // Test raw SQL query
    console.log('\n🔍 Testing raw SQL queries...');
    try {
      const { data, error } = await supabase.rpc('version');
      if (error) {
        console.log('   ❌ SQL queries not working:', error.message);
      } else {
        console.log('   ✅ SQL queries working');
      }
    } catch (err) {
      console.log('   ⚠️  SQL queries test inconclusive');
    }

    // Test Auth
    console.log('\n🔐 Testing Auth...');
    try {
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.log('   ❌ Auth admin access:', authError.message);
      } else {
        console.log(`   ✅ Auth working: ${users ? users.length : 0} users`);
      }
    } catch (err) {
      console.log('   ❌ Auth not accessible:', err.message);
    }

    return { success: true };

  } catch (error) {
    console.error('💥 Connection test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
if (require.main === module) {
  testSupabaseConnection()
    .then(result => {
      console.log('\n' + '='.repeat(50));
      if (result.success) {
        console.log('🎉 Basic connection test completed!');
        console.log('💡 Ready to create customer_users table');
      } else {
        console.log('❌ Connection test failed');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('💥 Script error:', err);
      process.exit(1);
    });
}

module.exports = { testSupabaseConnection };