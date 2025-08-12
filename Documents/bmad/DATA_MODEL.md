# Data Model Specification

## 📊 Final Data Structure

### 1. Customer Interface
```typescript
interface Customer {
  id: string;              // Col 1 from contracts (e.g., "21")
  name: string;            // Col 2 from contracts (e.g., "HOTEL MEDENA - SEGET DONJI")
  contracts: Contract[];   // Array of customer contracts
}

interface Contract {
  id: number;              // Col 4 from contracts (e.g., 1, 4, 62)
  name: string;            // Col 10 from contracts (e.g., "Razni preh pr 2025")
  dateFrom: string;        // Col 6 from contracts (e.g., "01.03.2024")
  dateTo: string;          // Col 7 from contracts (e.g., "30.12.2025")
  paymentTerms: number;    // Col 8 from contracts (e.g., 45)
  paymentMethod: string;   // Col 9 from contracts
}
```

### 2. Product Interface
```typescript
interface Product {
  code: string;            // Col 1 from products (e.g., "116")
  name: string;            // Col 6 from products (e.g., "Badem rinf.")
  altName?: string;        // Col 7 from products (e.g., "Aceton")
  unit: string;            // Col 8 from products (e.g., "KG", "KOM")
  category: ProductCategory;
  supplier: Supplier;
  weight: number;          // Col 41 from products (e.g., 1.0)
  packSize?: number;       // Col 9 from products
}

interface ProductCategory {
  id: number;              // Col 2 from products (e.g., 2)
  name: string;            // Col 3 from products (e.g., "prehrambeni proizvodi")
  subcategoryId: number;   // Col 4 from products (e.g., 14)
  subcategoryName: string; // Col 5 from products (e.g., "14. Suho voće i povrće")
}

interface Supplier {
  code: number;            // Col 20 from products (e.g., 434)
  name: string;            // Col 21 from products (e.g., "INFINITIV d.o.o.")
}
```

### 3. Customer-Product Relationship
```typescript
interface CustomerProduct {
  customerId: string;      // Links to Customer.id
  productCode: string;     // Links to Product.code
  contractId: number;      // Which contract this product belongs to
  price: number;           // Col 28 from contracts (e.g., 7.45)
  discount: number;        // Col 27 from contracts (e.g., 0, 1)
  isActive: boolean;       // Based on contract dates
}
```

### 4. Shopping Cart
```typescript
interface CartItem {
  productCode: string;     // Reference to Product
  quantity: number;        // User selected quantity
  pricePerUnit: number;    // From CustomerProduct.price
  totalPrice: number;      // quantity * pricePerUnit
}

interface Cart {
  customerId: string;      // Which customer owns this cart
  items: CartItem[];       // Array of cart items
  totalItems: number;      // Sum of all quantities
  totalValue: number;      // Sum of all totalPrice values
  lastUpdated: Date;       // Timestamp for localStorage
}
```

### 5. Order Export
```typescript
interface Order {
  id: string;              // Generated UUID
  customerId: string;      // Reference to customer
  customerName: string;    // For display in export
  items: OrderItem[];      // Products being ordered
  totalValue: number;      // Total order value
  createdAt: Date;         // Order timestamp
  status: 'draft' | 'exported' | 'sent';
}

interface OrderItem {
  productCode: string;     // Product reference
  productName: string;     // Product name for export
  unit: string;            // Measurement unit
  quantity: number;        // Ordered quantity
  pricePerUnit: number;    // Contract price
  totalPrice: number;      // Line total
  supplier: string;        // Supplier name
}
```

## 📁 JSON File Structure

### customers.json
```json
[
  {
    "id": "21",
    "name": "HOTEL MEDENA - SEGET DONJI",
    "contracts": [
      {
        "id": 1,
        "name": "Razni preh pr 2025",
        "dateFrom": "01.03.2024",
        "dateTo": "30.12.2025",
        "paymentTerms": 45,
        "paymentMethod": "TRANSAKCIJSKI RAČUN"
      }
    ]
  }
]
```

### products.json
```json
{
  "116": {
    "code": "116",
    "name": "Badem rinf.",
    "unit": "KG",
    "category": {
      "id": 2,
      "name": "prehrambeni proizvodi",
      "subcategoryId": 14,
      "subcategoryName": "14. Suho voće i povrće"
    },
    "supplier": {
      "code": 434,
      "name": "INFINITIV d.o.o."
    },
    "weight": 1.0,
    "packSize": 5
  }
}
```

### customer-products.json
```json
{
  "21": {
    "116": {
      "contractId": 1,
      "price": 7.45,
      "discount": 1,
      "isActive": true
    },
    "406": {
      "contractId": 1,
      "price": 5.07,
      "discount": 1,
      "isActive": true
    }
  }
}
```

## 🔄 Data Processing Flow

### 1. CSV to JSON Transformation
```
contracts.csv → Extract unique customers → customers.json
products.csv → Extract all products → products.json  
contracts.csv → Create customer-product mapping → customer-products.json
```

### 2. Runtime Data Access
```typescript
// Get customer list for dropdown
const customers = await getCustomers();

// Get products for specific customer
const products = await getCustomerProducts(customerId);

// Get product details
const productDetails = await getProduct(productCode);

// Calculate cart total
const cartTotal = calculateCartTotal(cartItems, customerProducts);
```

### 3. Data Validation Rules
```typescript
// Ensure all contracted products exist in catalog
validateProductMapping(contracts, products);

// Verify contract dates are valid
validateContractDates(contracts);

// Check price data integrity
validatePricing(customerProducts);

// Ensure no duplicate customers or products
validateUniqueness(customers, products);
```

## 🎯 API Response Formats

### GET /api/customers
```json
{
  "success": true,
  "data": [
    {
      "id": "21",
      "name": "HOTEL MEDENA - SEGET DONJI",
      "contractCount": 2,
      "productCount": 45
    }
  ],
  "count": 387
}
```

### GET /api/products/21
```json
{
  "success": true,
  "data": [
    {
      "code": "116",
      "name": "Badem rinf.",
      "unit": "KG",
      "price": 7.45,
      "category": "prehrambeni proizvodi",
      "supplier": "INFINITIV d.o.o.",
      "weight": 1.0
    }
  ],
  "count": 45,
  "customer": {
    "id": "21",
    "name": "HOTEL MEDENA - SEGET DONJI"
  }
}
```

### POST /api/export
```json
{
  "success": true,
  "data": {
    "orderId": "ORD_20240811_001",
    "filename": "narudžba_hotel_medena_20240811.xlsx",
    "downloadUrl": "/exports/narudžba_hotel_medena_20240811.xlsx",
    "items": 5,
    "totalValue": 156.78
  }
}
```

## 🚀 Performance Optimizations

### 1. Data Loading Strategy
- **customers.json**: Load once at app startup (~50KB)
- **products.json**: Load once, cache in memory (~500KB)
- **customer-products.json**: Load per customer request (~10KB per customer)

### 2. Search & Filter Optimization
```typescript
// Pre-index products by category for fast filtering
const productsByCategory = groupBy(products, 'category.name');

// Pre-index products by name for search
const searchIndex = createSearchIndex(products, ['name', 'altName']);

// Cache customer products after first load
const customerProductsCache = new Map<string, CustomerProduct[]>();
```

### 3. Memory Management
- Lazy load product details only when needed
- Use pagination for large product lists
- Clean up inactive customer data from memory
- Implement service worker caching for static data

This data model provides a solid foundation for the B2B webshop with efficient data access patterns and clear separation of concerns.