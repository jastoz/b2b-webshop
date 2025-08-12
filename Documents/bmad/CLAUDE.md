# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

B2B webshop for contract-based product ordering where 300+ customers can view and order products based on their specific contracts with negotiated prices. Built with Next.js 14 App Router, TypeScript, and Tailwind CSS.

## Key Commands

```bash
# CSV Data Processing (run first on new data)
npm run process-csv

# Development
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint

# Testing
npm run test         # Run Jest unit tests
npm run test:watch   # Jest in watch mode
npm run test:e2e     # Playwright end-to-end tests
```

## Architecture

### Data Flow
1. **CSV Processing**: `scripts/process-csv.js` converts CSV files to structured JSON
2. **Data Storage**: JSON files in `/data` directory (customers.json, products.json, customer-products.json)
3. **API Layer**: Next.js API routes serve customer-specific data
4. **Frontend**: React components with client-side cart management

### Core Concepts
- **Contract-based pricing**: Each customer sees only products from their contracts with negotiated prices
- **Customer-specific catalogs**: Product visibility filtered by customer contracts
- **No authentication**: Simple customer selection dropdown (300+ customers)
- **Croatian localization**: Currency formatting (EUR), date formats (DD.MM.YYYY)

## Data Structure

### Customer-Product Relationships
```typescript
// Customer sees products only from their contracts
customerProducts[customerId][productCode] = {
  contractId: number,
  price: number,        // Contract-negotiated price
  discount: number,
  isActive: boolean     // Contract date validity
}
```

### File Structure
```
src/
├── app/
│   ├── api/
│   │   ├── customers/route.ts        # GET all customers
│   │   └── products/[customer]/route.ts  # GET customer products
│   ├── customer-select/page.tsx      # Customer selection page
│   ├── katalog/[customer]/page.tsx   # Product catalog for customer
│   └── layout.tsx
├── components/
│   ├── CustomerSelectClient.tsx      # Customer dropdown
│   ├── ProductCatalogClient.tsx      # Product grid with filters
│   ├── ProductCard.tsx               # Individual product card
│   ├── ProductFilters.tsx            # Search and filter UI
│   └── Cart.tsx                      # Shopping cart sidebar
├── lib/
│   └── data.ts                       # Data access layer
└── types/
    └── index.ts                      # TypeScript definitions
```

## TypeScript Configuration

- Path alias: `@/*` maps to `./src/*`
- Strict mode disabled for flexibility
- JSON import enabled for data files

## Key Implementation Details

### Data Access Pattern
- All data queries go through `src/lib/data.ts`
- Caching implemented for performance
- Customer-product relationships are pre-computed during CSV processing

### Component Architecture
- **Server Components**: Initial data fetching and SEO
- **Client Components**: Interactive features (cart, filters)
- Cart state managed in localStorage with key `bmad_cart`

### Croatian Localization
- Currency: EUR with comma decimal separator
- Date format: DD.MM.YYYY (converted to ISO for processing)
- Number formatting: `new Intl.NumberFormat('hr-HR')`

### CSV Processing Details
- Contracts CSV: 71,976+ rows with customer-product-price relationships
- Products CSV: 5,227+ rows with product details
- Processing script handles Croatian decimal format (comma → dot)
- Validates contract date ranges for active products
- Generates data integrity reports

## Development Workflow

1. **New data**: Run `npm run process-csv` to regenerate JSON files
2. **Development**: Use `npm run dev` and test with various customer IDs
3. **Testing**: Customer selection → product catalog → cart functionality
4. **Build**: Ensure `npm run lint` and `npm run build` pass before deployment

## Performance Considerations

- JSON data files cached in memory
- Customer-specific product lists pre-filtered during CSV processing
- Lazy loading for product images and filters
- Client-side cart for immediate feedback

## Common Patterns

- API responses follow `ApiResponse<T>` interface pattern
- Error boundaries handle data loading failures gracefully
- Loading states for all async operations
- Responsive design with Tailwind CSS utilities