# Data Mapping Documentation

## 📊 CSV Files Analysis

### 1. Contracts CSV (`Tablicerabata artikli samo šifre.csv`)

**File Info:**
- **Size**: 71,976 rows (8.3MB)
- **Encoding**: UTF-8 with Croatian characters
- **Delimiter**: Semicolon (`;`)

**Column Structure:**
```
Col 1:  Partner ID (numeric: 21, 22, 23...)
Col 2:  Partner Name (text: "HOTEL MEDENA - SEGET DONJI")
Col 3:  Referent (mostly empty)
Col 4:  Contract Number (numeric: 1, 4, 62...)
Col 5:  Discount Table ID (numeric: 24, 62...)
Col 6:  Date From (DD.MM.YYYY: "01.03.2024")
Col 7:  Date To (DD.MM.YYYY: "30.12.2025")
Col 8:  Payment Terms (numeric: 45)
Col 9:  Payment Method (text: "TRANSAKCIJSKI RAČUN")
Col 10: Contract Name (text: "Razni preh pr 2025")
Col 11: Value (empty)
Col 12: Declaration (numeric: 1)
Col 13: Declaration Date (DD.MM.YYYY)
Col 14: Super Discount (numeric: 0)
Col 15: Limit (empty)
Col 16: Block (empty)
Col 17: Warranty Description (empty)
Col 18: Discount Table (text: "Izmjena - Hoteli Medena...")
Col 19: Group (empty)
Col 20: Subgroup (empty)
Col 21: Article Code (NUMERIC: 116, 406, 453...) ⭐ KEY FIELD
Col 22: Supplier (empty)
Col 23: Barcode (empty)
Col 24: Product Name (empty)
Col 25: RUC (empty)
Col 26: Empty
Col 27: Discount (numeric: 0, 1)
Col 28: VP Price (DECIMAL: 7.45, 5.07, 0.46...) ⭐ KEY FIELD
Col 29: Foreign Currency Price (numeric: 0)
```

**Sample Data:**
```csv
21;HOTEL MEDENA - SEGET DONJI; ;1;62;01.03.2024;30.12.2025;45;TRANSAKCIJSKI RAČUN;Razni preh pr 2025;;1;01.01.2000;0;;;;Izmjena - Hoteli Medena, Ola ,Viktoria,apartmani Medena 2025;;;116;;;;0;1;0;7,45;
21;HOTEL MEDENA - SEGET DONJI; ;1;62;01.03.2024;30.12.2025;45;TRANSAKCIJSKI RAČUN;Razni preh pr 2025;;1;01.01.2000;0;;;;Izmjena - Hoteli Medena, Ola ,Viktoria,apartmani Medena 2025;;;406;;;;0;1;0;5,07;
```

### 2. Products CSV (`artikli_s_tezinamaaaa progress 6.csv`)

**File Info:**
- **Size**: ~1.5MB
- **Encoding**: UTF-8
- **Delimiter**: Semicolon (`;`)

**Column Structure:**
```
Col 1:  Article Code (NUMERIC: 1, 4, 5, 116...) ⭐ KEY FIELD
Col 2:  Category ID (numeric: 2, 3, 4...)
Col 3:  Category Name (text: "prehrambeni proizvodi")
Col 4:  Subcategory ID (numeric: 11, 5, 1...)
Col 5:  Subcategory Name (text: "11. Začini, dodaci jelu i umaci")
Col 6:  Product Name (text: "Kvasac svježi 40g Hefe") ⭐ KEY FIELD
Col 7:  Alternative Name (text: "Aceton")
Col 8:  Unit (text: "KOM", "KG", "L") ⭐ KEY FIELD
Col 9:  Pack Size (numeric: 5, 20, 10...)
Col 10-13: Various numeric fields
Col 14-15: Status flags (0, 1, 7...)
Col 16-17: More numeric fields
Col 18-19: Barcode and internal codes
Col 20: Supplier Code (numeric: 3172, 413, 434...)
Col 21: Supplier Name (text: "KONZUM plus d.o.o.") ⭐ KEY FIELD
Col 22-23: Additional fields
Col 24: Weight/Volume (DECIMAL: 0.04, 0.125, 1...) ⭐ KEY FIELD
Col 25-40: Various flags and status fields
Col 41: Final Weight (DECIMAL) ⭐ KEY FIELD
```

**Sample Data:**
```csv
1;2;prehrambeni proizvodi;11;11. Začini, dodaci jelu i umaci;Kvasac svježi 40g Hefe;;KOM;;;;;1;0;;;;3172; KONZUM plus d.o.o.;;;0,04;;;;;;;;N;N;D;;;;;;;;;;;A;0,04
116;2;prehrambeni proizvodi;14;14. Suho voće i povrće;Badem rinf.;;KG;5;;;;7;0;;;;434;INFINITIV d.o.o.;;;1;;;;;;;;N;N;D;;;;;;;;;;;A;1
```

## 🔗 Data Relationships

### Primary Mapping
```
Contracts.Col21 (Article Code) → Products.Col1 (Article Code)
```

### Validation Examples
```
Contract Article 116 → Product "Badem rinf." ✅
Contract Article 406 → Product "Začin Češnjak sušeni u gran. 1/1" ✅
Contract Article 453 → Product "???" (needs verification)
```

### Missing Data Handling
- Some article codes in contracts may not exist in products catalog
- Some products may not be contracted by any customer
- Price mismatches need validation

## 📋 Data Processing Strategy

### 1. Extract Customers
```typescript
interface Customer {
  id: string;           // Col 1 from contracts
  name: string;         // Col 2 from contracts  
  contracts: number[];  // Unique Col 4 values
}
```

### 2. Extract Products  
```typescript
interface Product {
  code: string;         // Col 1 from products
  name: string;         // Col 6 from products
  unit: string;         // Col 8 from products
  category: string;     // Col 3 from products
  subcategory: string;  // Col 5 from products
  supplier: string;     // Col 21 from products
  weight: number;       // Col 41 from products
}
```

### 3. Create Customer-Product Mapping
```typescript
interface CustomerProduct {
  customerId: string;   // Col 1 from contracts
  productCode: string;  // Col 21 from contracts
  price: number;        // Col 28 from contracts
  contractId: number;   // Col 4 from contracts
  dateFrom: string;     // Col 6 from contracts
  dateTo: string;       // Col 7 from contracts
}
```

## ⚠️ Data Quality Issues

### Identified Issues:
1. **Encoding**: Croatian characters (č, š, ž, đ, ć)
2. **Decimal Format**: Comma as decimal separator (7,45 vs 7.45)
3. **Empty Fields**: Many optional columns are empty
4. **Inconsistent Naming**: Various formats for company names

### Cleaning Strategy:
1. **Character Encoding**: Ensure UTF-8 processing
2. **Decimal Parsing**: Convert commas to dots for numeric parsing
3. **Null Handling**: Default empty strings and null values
4. **Name Normalization**: Trim spaces and normalize formats

## 🧪 Data Validation

### Validation Rules:
1. Every contract article code must exist in products
2. Every customer must have at least one contracted product  
3. All prices must be positive numbers
4. Date ranges must be valid
5. Required fields cannot be empty

### Test Cases:
```javascript
// Test customer extraction
expect(customers).toHaveLength(300-400);
expect(customers[0]).toHaveProperty('id');
expect(customers[0]).toHaveProperty('name');

// Test product mapping
expect(products['116']).toEqual({
  code: '116',
  name: 'Badem rinf.',
  unit: 'KG',
  weight: 1
});

// Test customer-product relationship
expect(customerProducts['21']['116']).toEqual({
  price: 7.45,
  contractId: 1
});
```

## 📈 Processing Performance

### Estimated Processing Time:
- **Contracts CSV**: 71,976 rows → ~30 seconds
- **Products CSV**: ~15,000 rows → ~10 seconds  
- **JSON Generation**: ~5 seconds
- **Total**: ~45 seconds

### Memory Usage:
- **Raw CSV Data**: ~10MB in memory
- **Processed JSON**: ~5MB total
- **Peak Memory**: ~50MB during processing

### Optimization:
- Stream processing for large files
- Incremental JSON writing
- Memory cleanup after processing