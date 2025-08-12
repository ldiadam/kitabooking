# 🚀 Orange Sport Center - Quick Start Guide

## Database Setup Checklist

### ✅ Completed
- [x] Project structure created
- [x] Database schema designed
- [x] Migration files created
- [x] RLS policies defined
- [x] Database functions implemented
- [x] Sample data prepared
- [x] Setup scripts created

### 🔄 Next Steps (Your Action Required)

#### 1. Update Environment Variables
Replace placeholder values in `.env.local`:

```env
# Get these from https://app.supabase.com → Your Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# Keep these as-is for now
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=your_resend_api_key
WHATSAPP_TOKEN=your_whatsapp_token
SENTRY_DSN=your_sentry_dsn
```

#### 2. Run Database Migrations

**Option A: Supabase Dashboard (Recommended)**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project → SQL Editor
3. Copy and run each file in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_database_functions.sql`
   - `supabase/migrations/004_sample_data.sql`

**Option B: Supabase CLI**
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

#### 3. Create Admin User
1. Supabase Dashboard → Authentication → Users
2. Add user with your email/password
3. Table Editor → profiles → Update role to `'superadmin'`

#### 4. Test Setup
```bash
npm run dev
# Visit http://localhost:3000
```

## 🛠️ Useful Commands

```bash
# Check database setup status
npm run db:check

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## 📊 What You Get

### Database Tables
- **profiles** - User profiles with roles
- **venue_types** - Sports categories (Futsal, Basketball, etc.)
- **venues** - Individual sports facilities
- **venue_time_slots** - Available booking times
- **reservations** - Booking records
- **financial_transactions** - Income/expense tracking
- **events** - Promotional events
- **albums** & **photos** - Gallery management

### Sample Data
- 5 venue types
- 6 sample venues
- Time slots (6 AM - 11 PM)
- 3 events
- Photo galleries
- Financial records

### Features Ready
- 🔐 Authentication with role-based access
- 📱 Real-time booking updates
- 💰 Dynamic pricing engine
- 🛡️ Row Level Security (RLS)
- 📊 Financial tracking
- 🖼️ Gallery management
- 📧 Notification system (ready for integration)

## 🔧 Troubleshooting

### Common Issues

**"Invalid URL" Error**
- Update `.env.local` with real Supabase credentials

**"Permission Denied" in Database**
- Check RLS policies are applied
- Verify user role in profiles table

**Migration Fails**
- Run migrations one by one
- Check for syntax errors in SQL

**Real-time Not Working**
- Verify RLS policies allow subscriptions
- Check network connectivity

### Get Help
- 📖 Detailed guide: `DATABASE_SETUP.md`
- 🔍 Check setup: `npm run db:check`
- 📝 Review migration files in `supabase/migrations/`

## 🎯 Production Deployment

When ready for production:

1. **Vercel Deployment**
   - Connect GitHub repo to Vercel
   - Add environment variables
   - Deploy automatically

2. **Supabase Production**
   - Upgrade to paid plan if needed
   - Enable email confirmations
   - Set up proper backup
   - Configure custom domain

3. **Security Checklist**
   - Review RLS policies
   - Enable rate limiting
   - Set up monitoring
   - Configure CORS properly

---

**🎉 Your Orange Sport Center is ready to go!**

Once you complete the steps above, you'll have a fully functional sports venue booking system with modern architecture, real-time features, and enterprise-grade security.