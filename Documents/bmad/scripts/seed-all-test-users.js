const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedAllTestUsers() {
  try {
    console.log('🌱 Seeding all 263 test users to cloud Supabase...\n');

    // Step 1: Verify table exists
    console.log('1️⃣ Verifying customer_users table...');
    const { data: tableCheck, error: tableError, count } = await supabase
      .from('customer_users')
      .select('*', { count: 'exact', head: true });

    if (tableError) {
      console.log('❌ Table not found:', tableError.message);
      console.log('📝 Please run the SQL script first in Supabase dashboard');
      return { success: false, needsTable: true };
    }

    console.log(`✅ Table exists with ${count} existing records`);

    // Step 2: Load test users data
    console.log('\n2️⃣ Loading test users data...');
    const testUsersPath = path.join(process.cwd(), 'data', 'test-customer-users.json');
    
    if (!fs.existsSync(testUsersPath)) {
      console.log('❌ Test users file not found');
      console.log('💡 Run: node scripts/generate-test-users.js');
      return { success: false, error: 'Test users file missing' };
    }

    const testUsersData = JSON.parse(fs.readFileSync(testUsersPath, 'utf8'));
    const testUsers = testUsersData.data || [];
    console.log(`📧 Loaded ${testUsers.length} test users`);

    // Step 3: Clear existing data (optional - comment out to keep existing)
    const clearExisting = false; // Set to true if you want to clear first
    if (clearExisting) {
      console.log('\n3️⃣ Clearing existing customer_users...');
      const { error: deleteError } = await supabase
        .from('customer_users')
        .delete()
        .neq('id', 0);

      if (deleteError) {
        console.log('⚠️  Could not clear:', deleteError.message);
      } else {
        console.log('✅ Cleared existing data');
      }
    } else {
      console.log('\n3️⃣ Keeping existing data, inserting new records...');
    }

    // Step 4: Insert in batches
    console.log('\n4️⃣ Inserting test users in batches...');
    const batchSize = 25; // Smaller batches to avoid timeout
    let totalInserted = 0;
    let totalSkipped = 0;

    for (let i = 0; i < testUsers.length; i += batchSize) {
      const batch = testUsers.slice(i, i + batchSize);
      const batchNumber = Math.floor(i/batchSize) + 1;
      
      console.log(`📦 Processing batch ${batchNumber}/${Math.ceil(testUsers.length/batchSize)} (${batch.length} users)...`);
      
      // Prepare batch data
      const batchData = batch.map(user => ({
        customer_id: user.customer_id,
        email: user.email,
        full_name: user.full_name,
        is_primary: user.is_primary,
        is_active: user.is_active
      }));

      const { data: insertedUsers, error: insertError } = await supabase
        .from('customer_users')
        .upsert(batchData, { 
          onConflict: 'email',
          ignoreDuplicates: true 
        })
        .select();

      if (insertError) {
        console.log(`   ❌ Batch ${batchNumber} failed:`, insertError.message);
        
        // Try individual inserts for this batch
        console.log(`   🔄 Trying individual inserts for batch ${batchNumber}...`);
        for (const user of batchData) {
          const { data: singleUser, error: singleError } = await supabase
            .from('customer_users')
            .upsert([user], { 
              onConflict: 'email',
              ignoreDuplicates: true 
            })
            .select();
          
          if (singleError) {
            console.log(`      ❌ ${user.email}: ${singleError.message}`);
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

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Inserted: ${totalInserted} users`);
    console.log(`   ⏭️  Skipped: ${totalSkipped} users (duplicates)`);

    // Step 5: Final verification
    console.log('\n5️⃣ Final verification...');
    const { data: finalCheck, error: finalError, count: finalCount } = await supabase
      .from('customer_users')
      .select('*', { count: 'exact', head: true });

    if (finalError) {
      console.log('❌ Verification failed:', finalError.message);
    } else {
      console.log(`✅ Total users in database: ${finalCount}`);
      
      // Count by type
      const { data: primaryCount } = await supabase
        .from('customer_users')
        .select('*', { count: 'exact', head: true })
        .eq('is_primary', true);
      
      const { data: additionalCount } = await supabase
        .from('customer_users')
        .select('*', { count: 'exact', head: true })
        .eq('is_primary', false);

      console.log(`   👑 Primary contacts: ${primaryCount?.length || 0}`);
      console.log(`   👥 Additional users: ${additionalCount?.length || 0}`);
    }

    // Step 6: Show sample data with customer names
    console.log('\n6️⃣ Sample customer_users data:');
    const { data: sampleUsers, error: sampleError } = await supabase
      .from('customer_users')
      .select(`
        email,
        full_name,
        is_primary,
        customer_id,
        customers (customer_name)
      `)
      .limit(8);

    if (!sampleError && sampleUsers) {
      sampleUsers.forEach(user => {
        const primary = user.is_primary ? ' 👑' : '';
        const customerName = user.customers?.customer_name || `Customer ${user.customer_id}`;
        console.log(`   📧 ${user.email}${primary}`);
        console.log(`      → ${customerName}`);
      });
    }

    return {
      success: true,
      totalUsers: finalCount,
      inserted: totalInserted,
      skipped: totalSkipped
    };

  } catch (error) {
    console.error('💥 Seeding failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the seeding
if (require.main === module) {
  seedAllTestUsers()
    .then(result => {
      console.log('\n' + '='.repeat(50));
      if (result.success) {
        console.log('🎉 Test users seeding completed!');
        console.log(`👥 Total users: ${result.totalUsers}`);
        console.log(`✨ Inserted: ${result.inserted}, Skipped: ${result.skipped}`);
        console.log('\n🔗 Next steps:');
        console.log('   1. Test login at /login');
        console.log('   2. Test admin panel at /admin/customer-users');
        console.log('   3. Check sample logins at /data/sample-logins.json');
      } else if (result.needsTable) {
        console.log('📝 Please create customer_users table first');
        console.log('   Run the SQL script in Supabase dashboard');
      } else {
        console.log('❌ Seeding failed');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('💥 Script error:', err);
      process.exit(1);
    });
}

module.exports = { seedAllTestUsers };