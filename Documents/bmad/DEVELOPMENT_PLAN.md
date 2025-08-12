# Development Plan - B2B Webshop

## 🎯 Project Overview

**Goal**: Create a B2B webshop where 300-400 customers can order products according to their contract terms.

**Key Features**:
- Customer selection (no complex login)
- Contract-specific product catalog
- Contract pricing
- Shopping cart functionality
- Order export (Excel/PDF)

## 📋 Task Breakdown (31 Tasks)

### 🔧 Phase 1: PROJECT SETUP (3 tasks)
- [ ] **setup-nextjs**: Create Next.js application with TypeScript and Tailwind CSS
- [ ] **setup-dependencies**: Install required packages (csv-parser, xlsx, lodash)
- [ ] **create-docs**: Create important markdown documentation files ✅

### 📊 Phase 2: DATA ANALYSIS (4 tasks) 
- [x] **analyze-contracts**: Analyze contracts CSV structure and sample data ✅
- [ ] **analyze-products**: Analyze products CSV structure and map fields
- [ ] **design-data-model**: Design JSON data model for customers and products

### ⚙️ Phase 3: CSV PROCESSING (5 tasks)
- [ ] **create-csv-parser**: Create Python/Node script to parse both CSV files
- [ ] **extract-customers**: Extract unique customers from contracts CSV
- [ ] **extract-products**: Extract products with details from products CSV
- [ ] **map-customer-products**: Create mapping between customers and their contracted products
- [ ] **generate-json**: Generate clean JSON files for app consumption

### 🎨 Phase 4: FRONTEND CORE (4 tasks)
- [ ] **create-layout**: Create main app layout and navigation
- [ ] **customer-selector**: Build CustomerSelect dropdown component
- [ ] **product-grid**: Create ProductGrid component with search/filter
- [ ] **product-card**: Build individual ProductCard component

### 🛒 Phase 5: CART & ORDERS (4 tasks)
- [ ] **cart-component**: Create Cart component with localStorage persistence
- [ ] **cart-operations**: Implement add/remove/update cart operations
- [ ] **order-summary**: Build order summary and review screen
- [ ] **export-functionality**: Create Excel/CSV export functionality for orders

### 🔌 Phase 6: API & BACKEND (3 tasks)
- [ ] **api-customers**: Create /api/customers endpoint
- [ ] **api-products**: Create /api/products/[customer] endpoint
- [ ] **api-export**: Create /api/export endpoint for order generation

### 💅 Phase 7: STYLING & UX (3 tasks)
- [ ] **responsive-design**: Ensure responsive design for mobile/desktop
- [ ] **loading-states**: Add loading states and error handling
- [ ] **search-filters**: Implement product search and category filters

### 🧪 Phase 8: TESTING & QA (3 tasks)
- [ ] **test-csv-import**: Test CSV processing with full dataset
- [ ] **test-user-flow**: Test complete user flow with Playwright
- [ ] **test-mobile**: Test mobile responsiveness and usability

### 🚀 Phase 9: DEPLOYMENT (2 tasks)
- [ ] **optimize-build**: Optimize build size and performance
- [ ] **deploy-app**: Deploy to Vercel or DigitalOcean

## ⏱️ Time Estimation

### Detailed Breakdown:
```
Phase 1: PROJECT SETUP          → 0.5 days
Phase 2: DATA ANALYSIS          → 1.0 day
Phase 3: CSV PROCESSING         → 2.0 days  
Phase 4: FRONTEND CORE          → 2.5 days
Phase 5: CART & ORDERS          → 2.0 days
Phase 6: API & BACKEND          → 1.5 days
Phase 7: STYLING & UX           → 1.5 days
Phase 8: TESTING & QA           → 1.0 day
Phase 9: DEPLOYMENT             → 0.5 days

TOTAL: 12 days (2.4 work weeks)
```

### Critical Path:
```
DATA ANALYSIS → CSV PROCESSING → API BACKEND → FRONTEND CORE → CART & ORDERS → TESTING → DEPLOYMENT
```

## 🛠️ Technical Decisions

### Architecture Stack:
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Processing**: Node.js + csv-parser
- **Export**: SheetJS (xlsx)
- **Testing**: Playwright (MCP)
- **Deployment**: Vercel

### File Structure:
```
bmad/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Customer selection
│   │   ├── katalog/
│   │   │   └── [customer]/
│   │   │       └── page.tsx      # Product catalog
│   │   └── api/
│   │       ├── customers/        # GET customers
│   │       ├── products/         # GET products by customer
│   │       └── export/           # POST export order
│   ├── components/
│   │   ├── CustomerSelect.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductCard.tsx
│   │   └── Cart.tsx
│   └── lib/
│       ├── csv-processor.ts      # CSV to JSON conversion
│       ├── data-types.ts         # TypeScript interfaces
│       └── utils.ts              # Helper functions
├── data/
│   ├── customers.json            # Generated from CSV
│   ├── products.json             # Generated from CSV
│   └── customer-products.json    # Generated mappings
├── scripts/
│   └── process-csv.ts           # CSV processing script
└── public/
    └── exports/                  # Generated order files
```

### Data Flow:
```
CSV Files → processing script → JSON files → API endpoints → React components → User Interface
```

## 🔄 Development Workflow

### 1. Daily Workflow:
```bash
# Start development
git pull
npm run dev

# Process CSV changes (if needed)
npm run process-csv

# Run tests
npm run test
npm run test:e2e

# Commit progress
git add .
git commit -m "feat: implement XYZ functionality"
```

### 2. Testing Strategy:
- **Unit Tests**: Jest for utility functions
- **Component Tests**: React Testing Library
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for user flows
- **Data Validation**: CSV processing verification

### 3. Quality Gates:
- [ ] All TypeScript errors resolved
- [ ] All unit tests passing
- [ ] CSV processing validated with full dataset
- [ ] User flow E2E tests passing
- [ ] Mobile responsive design confirmed
- [ ] Performance metrics acceptable (<2s load time)

## 📈 Success Metrics

### Functional Requirements:
- [x] Customer can select their company
- [ ] Customer sees only their contracted products
- [ ] Prices match contract terms exactly
- [ ] Shopping cart works correctly
- [ ] Order export generates proper files
- [ ] Mobile experience is usable

### Performance Requirements:
- [ ] Initial page load < 2 seconds
- [ ] Product catalog load < 1 second
- [ ] Cart operations feel instant
- [ ] Export generation < 5 seconds

### Quality Requirements:
- [ ] Zero critical bugs
- [ ] 95%+ uptime
- [ ] Works on Chrome, Firefox, Safari
- [ ] Responsive on mobile devices

## 🚨 Risk Mitigation

### Technical Risks:
1. **Large CSV Processing**: Stream processing + chunking
2. **Performance Issues**: Pagination + lazy loading
3. **Data Inconsistencies**: Comprehensive validation
4. **Mobile Performance**: Optimized bundle size

### Business Risks:
1. **Data Changes**: Version-controlled CSV processing
2. **User Adoption**: Simple, intuitive UX
3. **Scalability**: Stateless architecture
4. **Maintenance**: Clear documentation + tests

### Contingency Plans:
- **CSV Processing Fails**: Manual JSON fallback
- **Performance Issues**: CDN + caching layer
- **API Downtime**: Static file fallback
- **Mobile Issues**: Progressive web app approach

## 🎯 Next Steps

### Immediate (Today):
1. ✅ Complete data analysis
2. ⏳ Finish products CSV mapping
3. ⏳ Design final data model

### This Week:
1. Complete CSV processing pipeline
2. Build core React components  
3. Implement basic API endpoints
4. Test with sample data

### Next Week:
1. Full UI/UX implementation
2. Cart and export functionality
3. Comprehensive testing
4. Production deployment

---

**Last Updated**: Current
**Status**: In Progress - Phase 2 (Data Analysis)
**Next Milestone**: Complete CSV Processing Pipeline