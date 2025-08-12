# Orange Sport Center - Supabase Database Setup

This directory contains all the necessary files to set up your Orange Sport Center database in Supabase.

## 📁 Directory Structure

```
supabase/
├── README.md                           # This file
├── config.toml                         # Supabase local development config
└── migrations/
    ├── 001_initial_schema.sql          # Core database schema
    ├── 002_rls_policies.sql            # Row Level Security policies
    ├── 003_database_functions.sql      # Custom PostgreSQL functions
    └── 004_sample_data.sql             # Sample data for testing
```

## 🗄️ Migration Files Overview

### 001_initial_schema.sql
**Purpose**: Creates the core database structure

**What it does**:
- Defines custom types (user_role, reservation_status, etc.)
- Creates all main tables with proper relationships
- Sets up indexes for performance
- Adds triggers for automatic timestamp updates

**Tables created**:
- `profiles` - User profiles extending Supabase auth
- `venue_types` - Categories of sports venues
- `venues` - Individual sports facilities
- `venue_time_slots` - Available time slots for booking
- `reservations` - Booking records
- `financial_transactions` - Income and expense tracking
- `events` - Promotional events and announcements
- `albums` - Photo gallery albums
- `photos` - Individual photos in albums

### 002_rls_policies.sql
**Purpose**: Implements Row Level Security for data protection

**What it does**:
- Creates helper functions for role checking
- Sets up RLS policies for each table
- Ensures users can only access appropriate data
- Implements role-based access control
- Creates trigger for automatic profile creation

**Security features**:
- Customers can only see their own reservations
- Staff can manage reservations and venues
- Admins have broader access
- SuperAdmins have full access
- Public read access for venues and events

### 003_database_functions.sql
**Purpose**: Implements business logic as database functions

**What it does**:
- Creates functions for complex business operations
- Implements pricing calculations
- Handles availability checking
- Manages reservation workflows
- Provides analytics and reporting functions

**Functions included**:
- `generate_reservation_code()` - Creates unique booking codes
- `calculate_venue_price()` - Dynamic pricing calculation
- `check_venue_availability()` - Conflict detection
- `get_available_time_slots()` - Available slot listing
- `create_reservation()` - Complete booking creation
- `update_reservation_status()` - Status management
- `get_venue_statistics()` - Performance metrics
- `get_financial_summary()` - Financial reporting
- `cancel_reservation()` - Booking cancellation

### 004_sample_data.sql
**Purpose**: Populates database with test data

**What it does**:
- Inserts sample venue types and venues
- Creates time slots with dynamic pricing
- Adds sample events and galleries
- Provides test financial transactions
- Sets up realistic test scenarios

**Sample data includes**:
- 5 venue types (Futsal, Basketball, Mini Soccer, Badminton, Tennis)
- 6 venues with different pricing and features
- Time slots from 6 AM to 11 PM
- 3 promotional events
- 3 photo albums with sample images
- Various financial transaction examples

## 🚀 Setup Instructions

### Quick Setup (Recommended)
1. Update `.env.local` with your Supabase credentials
2. Run: `npm run db:setup` to check your configuration
3. Go to Supabase Dashboard → SQL Editor
4. Run each migration file in numerical order
5. Create your first admin user
6. Test with `npm run dev`

### Detailed Setup
See `../DATABASE_SETUP.md` for comprehensive instructions

### Quick Start
See `../QUICK_START.md` for a checklist-style guide

## 🔧 Configuration

### config.toml
This file configures Supabase for local development:
- API and database ports
- Authentication settings
- Email templates
- OAuth providers (disabled by default)
- Storage and analytics configuration

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 🛡️ Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies enforce role-based access
- Users can only access their own data
- Admin roles have appropriate elevated access

### Data Validation
- Database constraints ensure data integrity
- Custom functions validate business rules
- Triggers maintain data consistency
- Indexes optimize query performance

### Authentication
- Integrates with Supabase Auth
- Automatic profile creation on signup
- Role-based permissions
- JWT token validation

## 📊 Database Schema Highlights

### Key Relationships
- Users → Profiles (1:1)
- Venues → Venue Types (N:1)
- Venues → Time Slots (1:N)
- Reservations → Venues (N:1)
- Reservations → Users (N:1)
- Financial Transactions → Venues (N:1)
- Photos → Albums (N:1)

### Performance Optimizations
- Indexes on frequently queried columns
- Composite indexes for complex queries
- Proper foreign key relationships
- Efficient RLS policy design

### Business Logic
- Dynamic pricing based on time and date
- Automatic reservation code generation
- Conflict detection for double bookings
- Financial transaction tracking
- Event and gallery management

## 🔍 Verification

After running migrations, verify your setup:

1. **Tables**: Check all 9 tables are created
2. **Policies**: Verify RLS policies in Auth → Policies
3. **Functions**: Check custom functions in Database → Functions
4. **Data**: Confirm sample data is inserted
5. **Permissions**: Test with different user roles

## 🆘 Troubleshooting

### Common Issues
- **Syntax errors**: Run migrations one by one to isolate issues
- **Permission denied**: Check RLS policies and user roles
- **Function errors**: Verify function parameters and return types
- **Data conflicts**: Check unique constraints and foreign keys

### Getting Help
- Review error messages in Supabase dashboard
- Check migration file syntax
- Verify environment variables
- Test with sample data first

## 🎯 Next Steps

After successful database setup:

1. **Test the application**: `npm run dev`
2. **Create admin user**: Set role to 'superadmin'
3. **Customize venues**: Add your actual venues
4. **Configure payments**: Set up payment integration
5. **Deploy to production**: Use Vercel + Supabase

---

**Your Orange Sport Center database is ready! 🎉**

This setup provides a solid foundation for a modern sports venue booking system with enterprise-grade features and security.