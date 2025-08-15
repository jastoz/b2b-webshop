import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSupabaseTables() {
  try {
    console.log('🔍 Checking cloud Supabase tables...\n');
    console.log('Project URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Check if we can connect by trying to count customers
    const { count: connectionTest, error: connectionError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      return { success: false, error: connectionError.message };
    }

    console.log(`✅ Successfully connected to Supabase (${connectionTest} customers)\n`);

    // Check tables manually since information_schema is not accessible
    const expectedTables = ['customers', 'products', 'customer_products', 'customer_users', 'categories', 'subcategories', 'contracts'];
    const tableNames = [];
    
    console.log('📊 Checking tables...');
    for (const table of expectedTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          tableNames.push(table);
          console.log(`   ✅ ${table}: ${count} records`);
        } else {
          console.log(`   ❌ ${table}: ${error.message}`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: Not accessible`);
      }
    }

    const missingTables = expectedTables.filter(table => !tableNames.includes(table));

    console.log('\n🎯 Table summary:');
    console.log(`   ✅ Found: ${tableNames.length}/${expectedTables.length} tables`);
    if (missingTables.length > 0) {
      console.log(`   ❌ Missing: ${missingTables.join(', ')}`);
    }

    // Check Auth setup
    console.log('\n🔐 Checking Auth setup...');
    try {
      const { data: authData, error: authError } = await supabase.auth.getSettings();
      if (authError) {
        console.log('   ❌ Auth not accessible:', authError.message);
      } else {
        console.log('   ✅ Auth is enabled');
      }
    } catch (err) {
      console.log('   ⚠️  Auth status unclear');
    }


    return {
      success: true,
      tables: tableNames,
      missingTables,
      hasCustomers: tableNames.includes('customers'),
      hasCustomerUsers: tableNames.includes('customer_users'),
      authEnabled: true
    };

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the check
checkSupabaseTables()
  .then(result => {
    console.log('\n' + '='.repeat(50));
    if (result.success) {
      console.log('🎉 Supabase check completed successfully!');
      
      if (result.missingTables.length > 0) {
        console.log(`⚠️  Missing tables: ${result.missingTables.join(', ')}`);
      } else {
        console.log('✅ All expected tables found!');
      }
    } else {
      console.log('❌ Supabase check failed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('💥 Script error:', err);
    process.exit(1);
  });

export { checkSupabaseTables };