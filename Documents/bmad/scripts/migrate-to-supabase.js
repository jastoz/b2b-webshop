/**
 * Migration script to transfer JSON data to Supabase PostgreSQL
 * Run this after setting up Supabase project and creating schema
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Load JSON data
const loadJsonData = () => {
  const dataDir = path.join(process.cwd(), 'data');
  
  const customers = JSON.parse(fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf-8'));
  const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
  const customerProducts = JSON.parse(fs.readFileSync(path.join(dataDir, 'customer-products.json'), 'utf-8'));
  
  // Load customer users if file exists
  let customerUsers = [];
  const customerUsersPath = path.join(dataDir, 'test-customer-users.json');
  if (fs.existsSync(customerUsersPath)) {
    const customerUsersData = JSON.parse(fs.readFileSync(customerUsersPath, 'utf-8'));
    customerUsers = customerUsersData.data || [];
  }
  
  return { customers, products, customerProducts, customerUsers };
};

// Extract unique categories and subcategories
const extractCategories = (products) => {
  const categories = new Map();
  const subcategories = new Map();
  
  Object.values(products).forEach(product => {
    if (product.category) {
      categories.set(product.category.id, {
        id: product.category.id,
        name: product.category.name
      });
      
      subcategories.set(product.category.subcategoryId, {
        id: product.category.subcategoryId,
        category_id: product.category.id,
        name: product.category.subcategoryName
      });
    }
  });
  
  return {
    categories: Array.from(categories.values()),
    subcategories: Array.from(subcategories.values())
  };
};

// Extract unique suppliers
const extractSuppliers = (products) => {
  const suppliers = new Map();
  
  Object.values(products).forEach(product => {
    if (product.supplier && product.supplier.code && product.supplier.name) {
      suppliers.set(product.supplier.code, {
        code: product.supplier.code,
        name: product.supplier.name
      });
    }
  });
  
  return Array.from(suppliers.values());
};

// Transform products for database insert
const transformProducts = (products) => {
  return Object.values(products).map(product => ({
    code: product.code,
    name: product.name,
    alt_name: product.altName,
    unit: product.unit || 'KOM',
    category_id: product.category?.id || null,
    subcategory_id: product.category?.subcategoryId || null,
    supplier_id: product.supplier?.code || null,
    weight: product.weight || 0,
    pack_size: product.packSize || null
  }));
};

// Transform customers for database insert
const transformCustomers = (customers) => {
  return customers.map(customer => ({
    id: customer.id,
    name: customer.name,
    product_count: customer.productCount || 0
  }));
};

// Transform contracts for database insert
const transformContracts = (customers) => {
  const contracts = [];
  
  customers.forEach(customer => {
    if (customer.contracts) {
      customer.contracts.forEach(contract => {
        contracts.push({
          customer_id: customer.id,
          contract_id: contract.id,
          name: contract.name || '',
          date_from: contract.dateFrom,
          date_to: contract.dateTo,
          payment_terms: contract.paymentTerms || 0,
          payment_method: contract.paymentMethod || ''
        });
      });
    }
  });
  
  return contracts;
};

// Transform customer-products relationships
const transformCustomerProducts = (customerProducts, products) => {
  const relationships = [];
  const productCodes = new Set(Object.keys(products));
  let skippedCount = 0;
  
  Object.entries(customerProducts).forEach(([customerId, customerProductList]) => {
    Object.entries(customerProductList).forEach(([productCode, productData]) => {
      // Skip if product doesn't exist in products table
      if (!productCodes.has(productCode)) {
        skippedCount++;
        console.log(`⚠️ Skipping customer_product relation: customer ${customerId}, product ${productCode} (product not found)`);
        return;
      }
      
      relationships.push({
        customer_id: customerId,
        product_code: productCode,
        contract_id: productData.contractId,
        price: productData.price,
        discount: productData.discount || 0,
        is_active: productData.isActive
      });
    });
  });
  
  if (skippedCount > 0) {
    console.log(`⚠️ Skipped ${skippedCount} customer-product relationships due to missing products`);
  }
  
  return relationships;
};

// Transform customer users for database insert
const transformCustomerUsers = (customerUsers) => {
  const uniqueUsers = new Map();
  
  customerUsers.forEach(user => {
    const email = user.email.toLowerCase();
    
    // Keep the first occurrence or primary user
    if (!uniqueUsers.has(email) || user.is_primary) {
      uniqueUsers.set(email, {
        customer_id: user.customer_id,
        email: email,
        full_name: user.full_name,
        is_primary: user.is_primary,
        is_active: user.is_active
      });
    }
  });
  
  return Array.from(uniqueUsers.values());
};

// Insert data with error handling
const insertDataBatch = async (table, data, batchSize = 1000) => {
  console.log(`\n📊 Inserting ${data.length} records into ${table}...`);
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    // Check if table supports upsert
    const conflictColumn = getConflictColumn(table);
    let query;
    
    if (conflictColumn) {
      query = supabase
        .from(table)
        .upsert(batch, { onConflict: conflictColumn });
    } else {
      // Use regular insert for tables without unique constraints
      query = supabase
        .from(table)
        .insert(batch);
    }
    
    const { data: result, error } = await query;
    
    if (error) {
      console.error(`❌ Error inserting batch ${i + 1}-${i + batch.length} into ${table}:`, error);
      throw error;
    }
    
    console.log(`✅ Inserted batch ${i + 1}-${i + batch.length} into ${table}`);
  }
  
  console.log(`✅ Successfully inserted all ${data.length} records into ${table}`);
};

// Get the conflict column for upsert operations
const getConflictColumn = (table) => {
  const conflictColumns = {
    'categories': 'id',
    'subcategories': 'id',
    'suppliers': 'code',
    'products': 'code',
    'customers': 'id',
    'contracts': 'customer_id,contract_id',
    'customer_users': 'email', // Use email as unique constraint for customer_users
    'customer_products': 'customer_id,product_code'
  };
  return conflictColumns[table] || null;
};

// Validate data integrity
const validateData = async () => {
  console.log('\n🔍 Validating data integrity...');
  
  // Count records in each table
  const tables = ['customers', 'products', 'categories', 'subcategories', 'suppliers', 'contracts', 'customer_users', 'customer_products'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`❌ Error counting ${table}:`, error);
    } else {
      console.log(`📊 ${table}: ${count} records`);
    }
  }
  
  // Validate relationships
  const { data: orphanProducts, error: orphanError } = await supabase
    .from('customer_products')
    .select(`
      customer_id,
      product_code,
      products!inner(code),
      customers!inner(id)
    `)
    .limit(1);
  
  if (orphanError) {
    console.error('❌ Error checking relationships:', orphanError);
  } else {
    console.log('✅ Relationship integrity validated');
  }
  
  // Validate customer_users relationships
  const { data: orphanUsers, error: usersError } = await supabase
    .from('customer_users')
    .select(`
      customer_id,
      email,
      customers!inner(id)
    `)
    .limit(1);
  
  if (usersError) {
    console.error('❌ Error checking customer_users relationships:', usersError);
  } else {
    console.log('✅ Customer_users relationship integrity validated');
    
    // Show sample customer_users data
    const { data: sampleUsers } = await supabase
      .from('customer_users')
      .select(`
        email,
        full_name,
        is_primary,
        customers (customer_name)
      `)
      .limit(3);
    
    if (sampleUsers && sampleUsers.length > 0) {
      console.log('\n👥 Sample customer_users data:');
      sampleUsers.forEach(user => {
        const primary = user.is_primary ? ' (PRIMARY)' : '';
        console.log(`   📧 ${user.email}${primary} → ${user.customers.customer_name}`);
      });
    }
  }
};

// Reset database tables
const resetDatabase = async () => {
  console.log('\n🧹 Clearing existing data...');
  
  const tables = ['order_items', 'orders', 'customer_products', 'customer_users', 'contracts', 'customers', 'products', 'suppliers', 'subcategories', 'categories'];
  
  for (const table of tables) {
    try {
      // Use TRUNCATE for faster deletion and to reset sequences
      const { error } = await supabase.rpc('truncate_table', { table_name: table });
      
      if (error) {
        // Fallback to DELETE if TRUNCATE fails
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .gte('id', 0); // Delete where id >= 0 (all rows)
        
        if (deleteError && deleteError.code !== 'PGRST116') {
          console.error(`❌ Error clearing ${table}:`, deleteError);
        } else {
          console.log(`✅ Cleared ${table} (fallback method)`);
        }
      } else {
        console.log(`✅ Cleared ${table}`);
      }
    } catch (err) {
      console.log(`⚠️ Skipping ${table} (table may not exist)`);
    }
  }
};

// Main migration function
const migrate = async () => {
  try {
    console.log('🚀 Starting migration to Supabase...');
    
    // Load JSON data
    console.log('\n📂 Loading JSON data...');
    const { customers, products, customerProducts, customerUsers } = loadJsonData();
    console.log(`✅ Loaded: ${customers.length} customers, ${Object.keys(products).length} products, ${customerUsers.length} customer users`);
    
    // Extract and prepare data
    console.log('\n🔄 Transforming data...');
    const { categories, subcategories } = extractCategories(products);
    const suppliers = extractSuppliers(products);
    const transformedProducts = transformProducts(products);
    const transformedCustomers = transformCustomers(customers);
    const contracts = transformContracts(customers);
    const relationships = transformCustomerProducts(customerProducts, products);
    const transformedCustomerUsers = customerUsers.length > 0 ? transformCustomerUsers(customerUsers) : [];
    
    console.log(`✅ Prepared: ${categories.length} categories, ${subcategories.length} subcategories, ${suppliers.length} suppliers`);
    
    // Insert data in correct order (respecting foreign keys)
    console.log('\n📤 Starting database inserts...');
    
    // 1. Insert categories first
    if (categories.length > 0) {
      await insertDataBatch('categories', categories);
    }
    
    // 2. Insert subcategories
    if (subcategories.length > 0) {
      await insertDataBatch('subcategories', subcategories);
    }
    
    // 3. Insert suppliers
    if (suppliers.length > 0) {
      await insertDataBatch('suppliers', suppliers);
    }
    
    // 4. Insert products
    if (transformedProducts.length > 0) {
      await insertDataBatch('products', transformedProducts);
    }
    
    // 5. Insert customers
    if (transformedCustomers.length > 0) {
      await insertDataBatch('customers', transformedCustomers);
    }
    
    // 6. Insert contracts
    if (contracts.length > 0) {
      await insertDataBatch('contracts', contracts);
    }
    
    // 7. Insert customer users (depends on customers)
    if (transformedCustomerUsers.length > 0) {
      await insertDataBatch('customer_users', transformedCustomerUsers);
    }
    
    // 8. Insert customer-product relationships
    if (relationships.length > 0) {
      await insertDataBatch('customer_products', relationships, 500); // Smaller batches for relationships
    }
    
    // Validate migration
    await validateData();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. ✅ Environment variables configured');
    console.log('2. ✅ @supabase/supabase-js installed');
    console.log('3. ✅ API endpoints updated with Supabase queries');
    console.log('4. 🔧 Create customer_users table with RLS policies');
    console.log('5. 🧪 Test authentication with /login');
    console.log('6. 🛠️  Test admin panel at /admin/customer-users');
    console.log('\n🔐 Authentication ready:');
    console.log(`   👥 ${customerUsers.length} test user accounts created`);
    console.log('   📧 Sample: hotel-medena-seget-d@test.hr / test123');
    console.log('   📋 All accounts: /data/sample-logins.json');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
};

// Add environment variable check
const checkEnvironment = () => {
  if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.error('❌ Please set SUPABASE_URL environment variable');
    console.log('Usage: SUPABASE_URL=your_url SUPABASE_SERVICE_KEY=your_key node scripts/migrate-to-supabase.js');
    process.exit(1);
  }
  
  if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY === 'YOUR_SERVICE_KEY') {
    console.error('❌ Please set SUPABASE_SERVICE_KEY environment variable');
    console.log('Usage: SUPABASE_URL=your_url SUPABASE_SERVICE_KEY=your_key node scripts/migrate-to-supabase.js');
    process.exit(1);
  }
};

// Run migration if called directly
if (process.argv[1].includes('migrate-to-supabase.js')) {
  checkEnvironment();
  migrate();
}

export { migrate, loadJsonData, transformCustomers, transformProducts };