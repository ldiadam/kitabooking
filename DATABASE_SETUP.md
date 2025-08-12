# Orange Sport Center - Database Setup Guide

This guide will help you set up the Supabase database for the Orange Sport Center booking system.

## Prerequisites

- Supabase account and project created
- Supabase CLI installed (optional, for local development)
- Access to your Supabase project dashboard

## Database Setup Steps

### 1. Connect to Your Supabase Project

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your Orange Sport Center project
3. Navigate to **Settings** → **API**
4. Copy your project URL and anon key
5. Update your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

### 2. Run Database Migrations

You have two options to set up your database:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the migration files in order:

   **Step 1: Initial Schema**
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run in SQL Editor

   **Step 2: RLS Policies**
   - Copy the contents of `supabase/migrations/002_rls_policies.sql`
   - Paste and run in SQL Editor

   **Step 3: Database Functions**
   - Copy the contents of `supabase/migrations/003_database_functions.sql`
   - Paste and run in SQL Editor

   **Step 4: Sample Data**
   - Copy the contents of `supabase/migrations/004_sample_data.sql`
   - Paste and run in SQL Editor

#### Option B: Using Supabase CLI (Advanced)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Push migrations:
   ```bash
   supabase db push
   ```

### 3. Verify Database Setup

After running the migrations, verify your setup:

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `profiles`
   - `venue_types`
   - `venues`
   - `venue_time_slots`
   - `reservations`
   - `financial_transactions`
   - `events`
   - `albums`
   - `photos`

3. Check **Authentication** → **Policies** to see RLS policies
4. Check **Database** → **Functions** to see custom functions

### 4. Create Your First Admin User

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **Add user**
3. Enter admin email and password
4. After user is created, go to **Table Editor** → **profiles**
5. Find the user's profile and update the `role` field to `'superadmin'`

### 5. Configure Storage (Optional)

For image uploads:

1. Go to **Storage** in Supabase dashboard
2. Create buckets:
   - `venues` (for venue images)
   - `events` (for event images)
   - `albums` (for gallery images)
   - `avatars` (for user profile pictures)

3. Set up storage policies for each bucket as needed

### 6. Test Your Setup

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. Try to sign up/login
4. Check if data loads correctly

## Database Schema Overview

### Core Tables

- **profiles**: User profiles extending Supabase auth
- **venue_types**: Categories of sports venues (Futsal, Basketball, etc.)
- **venues**: Individual sports facilities
- **venue_time_slots**: Available time slots for each venue
- **reservations**: Booking records
- **financial_transactions**: Income and expense tracking
- **events**: Promotional events and announcements
- **albums**: Photo gallery albums
- **photos**: Individual photos in albums

### Key Features

- **Row Level Security (RLS)**: Ensures users can only access their own data
- **Real-time subscriptions**: Live updates for bookings
- **Custom functions**: Business logic for pricing, availability, etc.
- **Triggers**: Automatic profile creation, timestamp updates
- **Indexes**: Optimized for common queries

## Sample Data Included

- 5 venue types (Futsal, Basketball, Mini Soccer, Badminton, Tennis)
- 6 sample venues with different pricing
- Time slots from 6 AM to 11 PM with dynamic pricing
- 3 sample events
- 3 photo albums with sample photos
- Sample financial transactions

## Security Features

- **Role-based access control**: Customer, Member, Staff, Admin, SuperAdmin
- **RLS policies**: Database-level security
- **Input validation**: Zod schemas for API validation
- **Authentication**: Supabase Auth with JWT tokens

## Troubleshooting

### Common Issues

1. **Migration fails**: Check for syntax errors, run migrations one by one
2. **RLS blocks queries**: Verify user roles and policies
3. **Functions not working**: Check function permissions and parameters
4. **Real-time not working**: Verify RLS policies allow subscriptions

### Getting Help

- Check Supabase documentation: https://supabase.com/docs
- Review migration files for any custom modifications needed
- Check the application logs for detailed error messages

## Next Steps

After database setup:

1. Update environment variables with real Supabase credentials
2. Test authentication flow
3. Implement booking system features
4. Set up payment integration
5. Configure email/SMS notifications
6. Deploy to production

## Production Considerations

- Enable email confirmations in production
- Set up proper backup strategies
- Configure monitoring and alerts
- Review and adjust RLS policies
- Set up proper CORS settings
- Configure rate limiting

Your Orange Sport Center database is now ready for development! 🎉