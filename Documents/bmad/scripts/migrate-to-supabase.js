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
  
  return { customers, products, customerProducts };
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

// Insert data with error handling
const insertDataBatch = async (table, data, batchSize = 1000) => {
  console.log(`\n📊 Inserting ${data.length} records into ${table}...`);
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { data: result, error } = await supabase
      .from(table)
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting batch ${i + 1}-${i + batch.length} into ${table}:`, error);
      throw error;
    }
    
    console.log(`✅ Inserted batch ${i + 1}-${i + batch.length} into ${table}`);
  }
  
  console.log(`✅ Successfully inserted all ${data.length} records into ${table}`);
};

// Validate data integrity
const validateData = async () => {
  console.log('\n🔍 Validating data integrity...');
  
  // Count records in each table
  const tables = ['customers', 'products', 'categories', 'subcategories', 'suppliers', 'contracts', 'customer_products'];
  
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
};

// Reset database tables
const resetDatabase = async () => {
  console.log('\n🧹 Clearing existing data...');
  
  const tables = ['order_items', 'orders', 'customer_products', 'contracts', 'customers', 'products', 'suppliers', 'subcategories', 'categories'];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', 'impossible_value'); // Delete all rows
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows to delete
      console.error(`❌ Error clearing ${table}:`, error);
    } else {
      console.log(`✅ Cleared ${table}`);
    }
  }
};

// Main migration function
const migrate = async () => {
  try {
    console.log('🚀 Starting migration to Supabase...');
    
    // Reset database first
    await resetDatabase();
    
    // Load JSON data
    console.log('\n📂 Loading JSON data...');
    const { customers, products, customerProducts } = loadJsonData();
    console.log(`✅ Loaded: ${customers.length} customers, ${Object.keys(products).length} products`);
    
    // Extract and prepare data
    console.log('\n🔄 Transforming data...');
    const { categories, subcategories } = extractCategories(products);
    const suppliers = extractSuppliers(products);
    const transformedProducts = transformProducts(products);
    const transformedCustomers = transformCustomers(customers);
    const contracts = transformContracts(customers);
    const relationships = transformCustomerProducts(customerProducts, products);
    
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
    
    // 7. Insert customer-product relationships
    if (relationships.length > 0) {
      await insertDataBatch('customer_products', relationships, 500); // Smaller batches for relationships
    }
    
    // Validate migration
    await validateData();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your environment variables with Supabase credentials');
    console.log('2. Install @supabase/supabase-js in your Next.js app');
    console.log('3. Replace API endpoints with Supabase queries');
    console.log('4. Test the application');
    
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