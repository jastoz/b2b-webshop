#!/usr/bin/env node

/**
 * CSV Processing Script for B2B Webshop
 * 
 * Converts two CSV files into structured JSON data:
 * 1. contracts.csv (71,976 rows) → customers.json + customer-products.json
 * 2. products.csv (5,227 rows) → products.json
 * 
 * Usage: node scripts/process-csv.js
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// File paths
const CONTRACTS_CSV = '/Users/tinburic/Desktop/n8n podaci/Tablicerabata artikli samo šifre.csv';
const PRODUCTS_CSV = '/Users/tinburic/Desktop/POS/artikli_s_tezinamaaaa progress 6.csv';
const DATA_DIR = path.join(__dirname, '../data');

// Output files
const CUSTOMERS_JSON = path.join(DATA_DIR, 'customers.json');
const PRODUCTS_JSON = path.join(DATA_DIR, 'products.json');
const CUSTOMER_PRODUCTS_JSON = path.join(DATA_DIR, 'customer-products.json');

// Data containers
let customers = new Map(); // customerId → customer data
let products = new Map();  // productCode → product data
let customerProducts = {}; // customerId → { productCode → product data }

// Utility functions
function cleanString(str) {
  if (!str) return '';
  return str.toString().trim().replace(/"/g, '');
}

function parseDecimal(value) {
  if (!value) return 0;
  // Handle Croatian decimal format (comma as decimal separator)
  const cleaned = value.toString().replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  // Handle DD.MM.YYYY format
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

function isValidDate(dateStr) {
  if (!dateStr) return false;
  const date = new Date(parseDate(dateStr));
  return !isNaN(date.getTime());
}

function isActiveContract(dateFrom, dateTo) {
  if (!isValidDate(dateFrom) || !isValidDate(dateTo)) return true; // Default to active if dates invalid
  
  const now = new Date();
  const start = new Date(parseDate(dateFrom));
  const end = new Date(parseDate(dateTo));
  
  return now >= start && now <= end;
}

// Process contracts CSV
async function processContracts() {
  console.log('📊 Processing contracts CSV...');
  
  let processedRows = 0;
  let skippedRows = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(CONTRACTS_CSV)
      .pipe(csv({ separator: ';', headers: false }))
      .on('data', (row) => {
        try {
          // Skip header rows
          if (processedRows < 2) {
            processedRows++;
            return;
          }
          
          const customerId = cleanString(row[0]);
          const customerName = cleanString(row[1]);
          const contractId = parseInt(row[3]) || 0;
          const contractName = cleanString(row[9]);
          const dateFrom = cleanString(row[5]);
          const dateTo = cleanString(row[6]);
          const paymentTerms = parseInt(row[7]) || 0;
          const paymentMethod = cleanString(row[8]);
          const productCode = cleanString(row[20]);
          const price = parseDecimal(row[27]);
          const discount = parseInt(row[26]) || 0;
          
          // Validate required fields
          if (!customerId || !customerName || !productCode) {
            skippedRows++;
            return;
          }
          
          // Add/update customer
          if (!customers.has(customerId)) {
            customers.set(customerId, {
              id: customerId,
              name: customerName,
              contracts: new Map()
            });
          }
          
          const customer = customers.get(customerId);
          
          // Add contract if not exists
          if (contractId && !customer.contracts.has(contractId)) {
            customer.contracts.set(contractId, {
              id: contractId,
              name: contractName,
              dateFrom: parseDate(dateFrom),
              dateTo: parseDate(dateTo),
              paymentTerms: paymentTerms,
              paymentMethod: paymentMethod
            });
          }
          
          // Add customer-product mapping
          if (!customerProducts[customerId]) {
            customerProducts[customerId] = {};
          }
          
          customerProducts[customerId][productCode] = {
            contractId: contractId,
            price: price,
            discount: discount,
            isActive: isActiveContract(dateFrom, dateTo)
          };
          
          processedRows++;
          
          // Progress indicator
          if (processedRows % 10000 === 0) {
            console.log(`  Processed ${processedRows} contracts...`);
          }
        } catch (error) {
          console.error(`Error processing row ${processedRows}:`, error.message);
          skippedRows++;
        }
      })
      .on('end', () => {
        console.log(`✅ Contracts processed: ${processedRows} rows, ${skippedRows} skipped`);
        console.log(`   Found ${customers.size} unique customers`);
        resolve();
      })
      .on('error', reject);
  });
}

// Process products CSV
async function processProducts() {
  console.log('🛍️ Processing products CSV...');
  
  let processedRows = 0;
  let skippedRows = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(PRODUCTS_CSV)
      .pipe(csv({ separator: ';', headers: false }))
      .on('data', (row) => {
        try {
          // Skip header rows
          if (processedRows < 2) {
            processedRows++;
            return;
          }
          
          const productCode = cleanString(row[0]);
          const categoryId = parseInt(row[1]) || 0;
          const categoryName = cleanString(row[2]);
          const subcategoryId = parseInt(row[3]) || 0;
          const subcategoryName = cleanString(row[4]);
          const productName = cleanString(row[5]);
          const altName = cleanString(row[6]);
          const unit = cleanString(row[7]);
          const packSize = parseInt(row[8]) || null;
          const supplierCode = parseInt(row[19]) || 0;
          const supplierName = cleanString(row[20]);
          const weight = parseDecimal(row[40]);
          
          // Validate required fields
          if (!productCode || !productName || !unit) {
            skippedRows++;
            return;
          }
          
          products.set(productCode, {
            code: productCode,
            name: productName,
            altName: altName || null,
            unit: unit,
            category: {
              id: categoryId,
              name: categoryName,
              subcategoryId: subcategoryId,
              subcategoryName: subcategoryName
            },
            supplier: {
              code: supplierCode,
              name: supplierName
            },
            weight: weight,
            packSize: packSize
          });
          
          processedRows++;
          
          // Progress indicator
          if (processedRows % 1000 === 0) {
            console.log(`  Processed ${processedRows} products...`);
          }
        } catch (error) {
          console.error(`Error processing product row ${processedRows}:`, error.message);
          skippedRows++;
        }
      })
      .on('end', () => {
        console.log(`✅ Products processed: ${processedRows} rows, ${skippedRows} skipped`);
        console.log(`   Found ${products.size} unique products`);
        resolve();
      })
      .on('error', reject);
  });
}

// Validate data integrity
function validateData() {
  console.log('🔍 Validating data integrity...');
  
  let missingProducts = 0;
  let totalCustomerProducts = 0;
  
  for (const [customerId, customerProductMap] of Object.entries(customerProducts)) {
    for (const [productCode, productData] of Object.entries(customerProductMap)) {
      totalCustomerProducts++;
      
      if (!products.has(productCode)) {
        missingProducts++;
        console.warn(`⚠️  Product ${productCode} in customer ${customerId} not found in products catalog`);
      }
    }
  }
  
  console.log(`📈 Data validation complete:`);
  console.log(`   Total customer-product relationships: ${totalCustomerProducts}`);
  console.log(`   Missing products in catalog: ${missingProducts}`);
  console.log(`   Data integrity: ${((totalCustomerProducts - missingProducts) / totalCustomerProducts * 100).toFixed(1)}%`);
}

// Generate JSON files
function generateJSON() {
  console.log('💾 Generating JSON files...');
  
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // Convert customers Map to array with contracts as arrays
  const customersArray = Array.from(customers.values()).map(customer => ({
    ...customer,
    contracts: Array.from(customer.contracts.values()),
    productCount: Object.keys(customerProducts[customer.id] || {}).length
  }));
  
  // Convert products Map to object
  const productsObject = Object.fromEntries(products);
  
  // Write customers.json
  fs.writeFileSync(CUSTOMERS_JSON, JSON.stringify(customersArray, null, 2));
  console.log(`✅ Created ${CUSTOMERS_JSON} (${customersArray.length} customers)`);
  
  // Write products.json
  fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(productsObject, null, 2));
  console.log(`✅ Created ${PRODUCTS_JSON} (${Object.keys(productsObject).length} products)`);
  
  // Write customer-products.json
  fs.writeFileSync(CUSTOMER_PRODUCTS_JSON, JSON.stringify(customerProducts, null, 2));
  console.log(`✅ Created ${CUSTOMER_PRODUCTS_JSON}`);
}

// Print summary statistics
function printSummary() {
  console.log('\\n📊 Processing Summary:');
  console.log('='.repeat(50));
  console.log(`Customers: ${customers.size}`);
  console.log(`Products: ${products.size}`);
  console.log(`Customer-Product relationships: ${Object.values(customerProducts).reduce((sum, cp) => sum + Object.keys(cp).length, 0)}`);
  
  // Top customers by product count
  const topCustomers = Array.from(customers.values())
    .map(c => ({ name: c.name, productCount: Object.keys(customerProducts[c.id] || {}).length }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 5);
  
  console.log('\\nTop 5 customers by product count:');
  topCustomers.forEach((customer, index) => {
    console.log(`${index + 1}. ${customer.name}: ${customer.productCount} products`);
  });
  
  // File sizes
  const customersSize = fs.statSync(CUSTOMERS_JSON).size;
  const productsSize = fs.statSync(PRODUCTS_JSON).size;
  const customerProductsSize = fs.statSync(CUSTOMER_PRODUCTS_JSON).size;
  
  console.log('\\nGenerated file sizes:');
  console.log(`customers.json: ${(customersSize / 1024).toFixed(1)} KB`);
  console.log(`products.json: ${(productsSize / 1024).toFixed(1)} KB`);
  console.log(`customer-products.json: ${(customerProductsSize / 1024).toFixed(1)} KB`);
  console.log(`Total: ${((customersSize + productsSize + customerProductsSize) / 1024).toFixed(1)} KB`);
}

// Main execution
async function main() {
  console.log('🚀 Starting CSV processing for B2B Webshop...');
  console.log('='.repeat(50));
  
  try {
    // Check if CSV files exist
    if (!fs.existsSync(CONTRACTS_CSV)) {
      throw new Error(`Contracts CSV not found: ${CONTRACTS_CSV}`);
    }
    if (!fs.existsSync(PRODUCTS_CSV)) {
      throw new Error(`Products CSV not found: ${PRODUCTS_CSV}`);
    }
    
    // Process both CSV files
    await processContracts();
    await processProducts();
    
    // Validate data
    validateData();
    
    // Generate JSON files
    generateJSON();
    
    // Print summary
    printSummary();
    
    console.log('\\n🎉 CSV processing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during CSV processing:', error.message);
    process.exit(1);
  }
}

// Run only if called directly
if (require.main === module) {
  main();
}

module.exports = { main, processContracts, processProducts, validateData };