# B2B Webshop - Projektna Specifikacija

## 📝 Zahtjevi Klijenta

### Osnovni Zahtjev
Kreiranje web aplikacije koja omogućava kupćima da naruče robu po svojim ugovornim uvjetima.

### Ključni Zahtjevi
1. **300-400 kupaca** može koristiti sustav
2. **Bez složenog logina** - jednostavan odabir kupca
3. **Ugovorni artikli** - svaki kupac vidi samo svoje artikle
4. **Ugovorne cijene** - specifične cijene po kupcu
5. **Naručivanje** - dodavanje u košaricu i finaliza

## 📊 Analiza Postojećih Podataka

### CSV Datoteke

#### 1. Ugovori (`Tablicerabata artikli samo šifre.csv`)
**Veličina**: 71,976 redaka (8.3MB)

**Struktura**:
```
Kolona 1: Partner ID (21)
Kolona 2: Naziv Partnera (HOTEL MEDENA - SEGET DONJI)
Kolona 21: Šifra Artikla (116, 406, 453...)
Kolona 28: VP Cijena (7.45, 5.07, 0.46...)
```

**Primjer**:
```
21;HOTEL MEDENA - SEGET DONJA; ;1;62;01.03.2024;30.12.2025;45;TRANSAKCIJSKI RAČUN;Razni preh pr 2025;;1;01.01.2000;0;;;;Izmjena - Hoteli Medena, Ola ,Viktoria,apartmani Medena 2025;;;116;;;;0;1;0;7,45;
```

#### 2. Artikli (`artikli_s_tezinamaaaa progress 6.csv`)
**Veličina**: ~1.5MB

**Struktura**:
```
Kolona 1: Šifra Artikla (116)
Kolona 6: Naziv Artikla (Badem rinf.)
Kolona 8: Mjerna Jedinica (KG)
Kolona 34: Težina (1)
```

**Primjer**:
```
116;2;prehrambeni proizvodi;14;14. Suho voće i povrće;Badem rinf.;;KG;5;;;;7;0;;;;434;INFINITIV d.o.o.;;;1;;;;;;;;N;N;D;;;;;;;;;;;A;1
```

### Mapiranje Podataka ✅
- Šifra artikla **116** iz ugovora → **"Badem rinf."** iz kataloga
- Šifra artikla **406** iz ugovora → **"Začin Češnjak sušeni u gran. 1/1"** iz kataloga
- **Mapiranje je uspješno potvrđeno**

## 🎯 Rješenje

### Arhitektura
```
Frontend (Next.js)
├── Selektor Kupaca
├── Katalog Artikala (filtered)
├── Košarica (localStorage)
└── Export Narudžbe

Backend (API Routes)
├── /api/customers
├── /api/products/[customerId]
└── /api/export

Data Processing
├── CSV → JSON parser
├── Customer extraction
└── Product mapping
```

### User Flow
```
1. Odabir kupca (dropdown)
   ↓
2. Preusmjeravanje na katalog
   ↓
3. Pregled ugovornih artikala s cijenama
   ↓
4. Dodavanje u košaricu
   ↓
5. Export narudžbe (Excel/PDF)
```

## 🎨 UI/UX Specifikacija

### Stranica 1: Selektor Kupaca
```
┌─────────────────────────────────────┐
│  🏢 B2B Webshop                     │
├─────────────────────────────────────┤
│                                     │
│  Odaberite vašu firmu:              │
│  ┌─────────────────────────────────┐ │
│  │ [🔍] HOTEL MEDENA - SEGET DON.. ▼│ │
│  └─────────────────────────────────┘ │
│                                     │
│         [Nastavi →]                 │
└─────────────────────────────────────┘
```

### Stranica 2: Katalog Artikala
```
┌─────────────────────────────────────────────────────┐
│ 🏢 HOTEL MEDENA        🛒 Košarica (3)   [Export]    │
├─────────────────────────────────────────────────────┤
│ 🔍 [Pretraži artikle...             ] [Filter ▼]   │
├─────────────────────────────────────────────────────┤
│ ┌──────────────┬──────────────┬─────────────────────┐│
│ │ 📦 Badem     │ 📦 Začin     │ 📦 Juha Pod.       ││
│ │ rinf.        │ Češnjak      │ grašak 1kg         ││
│ │ 1 KG         │ sušeni       │ 1 KOM              ││
│ │ 7,45 €       │ 1 KOM        │ 1,00 €             ││
│ │ [+ Dodaj]    │ 5,07 €       │ [+ Dodaj]          ││
│ │              │ [+ Dodaj]    │                    ││
│ └──────────────┴──────────────┴─────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## 🔧 Tehnički Detalji

### Dependencies
```json
{
  "next": "14.x",
  "react": "18.x",
  "typescript": "5.x",
  "tailwindcss": "3.x",
  "csv-parser": "^3.0.0",
  "xlsx": "^0.18.0",
  "lodash": "^4.17.0"
}
```

### File Structure
```
bmad/
├── pages/
│   ├── index.tsx           # Customer selector
│   ├── katalog/
│   │   └── [customer].tsx  # Product catalog
│   └── api/
│       ├── customers.ts    # GET customers list
│       ├── products/
│       │   └── [customer].ts # GET products for customer
│       └── export.ts       # POST export order
├── components/
│   ├── CustomerSelect.tsx
│   ├── ProductGrid.tsx
│   ├── ProductCard.tsx
│   └── Cart.tsx
├── data/
│   ├── customers.json      # Generated
│   ├── products.json       # Generated
│   └── customer-products.json # Generated
├── scripts/
│   └── process-csv.js      # CSV → JSON
└── public/
    └── exports/            # Generated orders
```

## ⏱️ Vremenska Procjena

### Faza 1: Data Processing (2 dana)
- CSV analiza i parsing
- JSON generiranje
- Data validacija

### Faza 2: Core Development (4 dana)
- Next.js setup
- React komponente
- API endpoints

### Faza 3: UI/UX (2 dana)
- Tailwind styling
- Responsive design
- Loading states

### Faza 4: Testing & Deploy (1 dan)
- Playwright testiranje
- Vercel deployment

**Ukupno: 9 radnih dana**

## 🚀 Success Criteria

1. ✅ Kupac može odabrati svoju firmu
2. ✅ Vidi samo svoje ugovorne artikle
3. ✅ Cijene su točne prema ugovoru
4. ✅ Može dodati artikle u košaricu
5. ✅ Može exportat narudžbu
6. ✅ Responsive design (mobitel/desktop)
7. ✅ Brza učitavanja (<2s)

## 🔐 Security & Privacy

- Nema osjetljivih podataka u frontend kodu
- CSV datoteke se procesiraju server-side
- JSON datoteke se generiraju automatski
- Nema persistentnog storagea korisničkih podataka