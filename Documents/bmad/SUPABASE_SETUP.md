# Supabase Setup Guide

## 📋 Prerequisites
- Supabase account (free tier sufficient)
- Node.js 18+ installed
- Your B2B webshop project ready

## 🚀 Quick Setup (10 minutes)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in/up and click "New Project"
3. Choose organization and set:
   - **Name**: `b2b-webshop-production`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your users
4. Wait for project creation (~2 minutes)

### 2. Get API Credentials
1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon/public key**: `eyJhbGci...`
   - **service_role key**: `eyJhbGci...` (for migration only)

### 3. Setup Environment Variables
1. Copy `.env.local.template` to `.env.local`
2. Fill in your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key
SUPABASE_SERVICE_KEY=eyJhbGci...your-service-key
```

### 4. Create Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Copy contents of `supabase-schema.sql`
3. Paste and run the SQL script
4. Verify tables created in **Table Editor**

### 5. Migrate Data
```bash
# Install dependencies
npm install

# Run migration (ensure .env.local is configured)
npm run migrate-supabase
```

Expected output:
```
🚀 Starting migration to Supabase...
✅ Loaded: 201 customers, 5227 products
📊 Inserting 15 records into categories...
📊 Inserting 47 records into subcategories...
📊 Inserting 89 records into suppliers...
📊 Inserting 5227 records into products...
📊 Inserting 201 records into customers...
📊 Inserting 458 records into contracts...
📊 Inserting 67539 records into customer_products...
🎉 Migration completed successfully!
```

### 6. Verify Data
1. In Supabase **Table Editor**, check:
   - `customers`: 201 records
   - `products`: 5227 records  
   - `customer_products`: ~67k records
2. Test queries in **SQL Editor**:
```sql
-- Check customer products
SELECT COUNT(*) FROM customer_products WHERE customer_id = '21';

-- Test search function
SELECT * FROM search_customer_products('21', 'badem', '', 10);
```

### 7. Update Application
The migration script automatically switches your app to use Supabase instead of JSON files. Your existing frontend will work without changes!

## 🔐 Security Notes

### Row Level Security (RLS)
Your data is protected with PostgreSQL RLS:
- Customers see only their own products/orders
- Authentication required for data access
- Public access to product catalog only

### API Keys Security
- ✅ **anon/public key**: Safe for frontend use
- ⚠️ **service_role key**: SERVER ONLY - never expose to client
- 🔒 Store in `.env.local` (never commit to git)

## 📊 Free Tier Limits

Your B2B webshop comfortably fits in Supabase free tier:
- **Database**: 500MB limit (you use ~15MB)
- **Users**: 50,000 monthly active users
- **API calls**: Unlimited
- **Storage**: 1GB file storage
- **Bandwidth**: 2GB egress/month

## 🔧 Troubleshooting

### Migration Errors
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Test connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient('YOUR_URL', 'YOUR_KEY');
console.log('Connected to:', client.supabaseUrl);
"
```

### RLS Issues
If you get "new row violates row-level security":
1. Check if user is authenticated
2. Verify RLS policies in **Authentication** → **Policies**
3. Test queries as specific user in SQL Editor

### Performance Issues
- Add indexes for frequently queried columns
- Use the provided PostgreSQL functions for complex queries
- Monitor query performance in **Logs** section

## 🚀 Going Live

### Production Checklist
- [ ] Database schema applied
- [ ] All data migrated and verified
- [ ] Environment variables set
- [ ] RLS policies tested
- [ ] Backup strategy planned

### Monitoring
Monitor your usage in Supabase dashboard:
- **Database** → Storage usage
- **Reports** → API usage
- **Logs** → Error monitoring

## 📈 Scaling Beyond Free Tier

When you grow beyond free tier limits:
- **Pro Plan**: $25/month for 8GB database, 100GB bandwidth
- **Team Plan**: $599/month for team features
- **Enterprise**: Custom pricing for large scale

Your current usage (~15MB database, 201 users) can stay on free tier for years!