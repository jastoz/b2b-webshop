# B2B Webshop - Ugovorni Artikli

## 📋 Pregled Projekta

Web aplikacija za B2B kupce koja omogućava pregled i naručivanje artikla prema ugovornim uvjetima. Svaki kupac vidi samo artikle iz svojih ugovora s ugovorenim cijenama.

### Ključne Funkcionalnosti
- 🏢 **Selektor kupaca** - izbor iz 300+ kupaca
- 🛍️ **Ugovorni katalog** - samo artikli iz ugovora kupca
- 💰 **Ugovorne cijene** - specifične cijene po kupcu/ugovoru
- 🛒 **Košarica** - dodavanje artikala i količina
- 📤 **Export narudžbe** - PDF/Excel izvoz narudžbe

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Data Processing**: Node.js CSV parsers
- **Storage**: JSON files (processed from CSV)
- **Export**: SheetJS (xlsx)
- **Hosting**: Vercel

## 📁 Struktura Podataka

### Source Files
- `contracts.csv` - Ugovori kupaca s artiklima i cijenama
- `products.csv` - Katalog svih artikala s detaljima

### Generated Files
- `customers.json` - Lista kupaca
- `products.json` - Detalji artikala
- `customer-products.json` - Mapping kupac → artikli + cijene

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Process CSV files
npm run process-csv

# Start development server
npm run dev
```

## 📊 Data Structure

### Customers
```json
{
  "id": "21",
  "name": "HOTEL MEDENA - SEGET DONJI",
  "contracts": [1, 4]
}
```

### Products
```json
{
  "code": "116",
  "name": "Badem rinf.",
  "unit": "KG",
  "weight": 1,
  "supplier": "INFINITIV d.o.o."
}
```

### Customer-Products Mapping
```json
{
  "customerId": "21",
  "productCode": "116",
  "price": 7.45,
  "contractId": 1
}
```

## 🛠️ Development

- `/pages/index.js` - Customer selection
- `/pages/katalog/[customer].js` - Product catalog
- `/components/` - Reusable UI components
- `/api/` - Backend API endpoints
- `/scripts/` - CSV processing scripts

## 🧪 Testing

- Unit tests: Jest + React Testing Library
- E2E tests: Playwright (via MCP)
- CSV processing validation

## 🚀 Deployment

- **Production**: Vercel
- **Staging**: Vercel Preview
- **Local**: `npm run dev`

## 📝 Progress Tracking

See todo list in development console for current progress.

## 🤝 Contributing

1. Analyze CSV structure changes
2. Update processing scripts
3. Test with sample data
4. Deploy to staging
5. Production release