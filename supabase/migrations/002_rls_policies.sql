-- Row Level Security Policies
-- Migration: RLS policies for all tables

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin or higher
CREATE OR REPLACE FUNCTION is_admin_or_higher(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role IN ('admin', 'superadmin') FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is staff or higher
CREATE OR REPLACE FUNCTION is_staff_or_higher(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role IN ('staff', 'admin', 'superadmin') FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES TABLE POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_admin_or_higher(auth.uid()));

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (is_admin_or_higher(auth.uid()));

-- Superadmins can insert profiles
CREATE POLICY "Superadmins can insert profiles" ON profiles
    FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'superadmin');

-- Auto-insert profile on user signup
CREATE POLICY "Enable insert for authenticated users during signup" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- VENUE_TYPES TABLE POLICIES
-- Everyone can view active venue types
CREATE POLICY "Everyone can view active venue types" ON venue_types
    FOR SELECT USING (is_active = true OR is_staff_or_higher(auth.uid()));

-- Staff and above can manage venue types
CREATE POLICY "Staff can manage venue types" ON venue_types
    FOR ALL USING (is_staff_or_higher(auth.uid()));

-- VENUES TABLE POLICIES
-- Everyone can view active venues
CREATE POLICY "Everyone can view active venues" ON venues
    FOR SELECT USING (is_active = true OR is_staff_or_higher(auth.uid()));

-- Staff and above can manage venues
CREATE POLICY "Staff can manage venues" ON venues
    FOR ALL USING (is_staff_or_higher(auth.uid()));

-- VENUE_TIME_SLOTS TABLE POLICIES
-- Everyone can view available time slots
CREATE POLICY "Everyone can view time slots" ON venue_time_slots
    FOR SELECT USING (is_available = true OR is_staff_or_higher(auth.uid()));

-- Staff and above can manage time slots
CREATE POLICY "Staff can manage time slots" ON venue_time_slots
    FOR ALL USING (is_staff_or_higher(auth.uid()));

-- RESERVATIONS TABLE POLICIES
-- Users can view their own reservations
CREATE POLICY "Users can view own reservations" ON reservations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own reservations
CREATE POLICY "Users can create own reservations" ON reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending reservations
CREATE POLICY "Users can update own pending reservations" ON reservations
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

-- Staff and above can view all reservations
CREATE POLICY "Staff can view all reservations" ON reservations
    FOR SELECT USING (is_staff_or_higher(auth.uid()));

-- Staff and above can manage all reservations
CREATE POLICY "Staff can manage all reservations" ON reservations
    FOR ALL USING (is_staff_or_higher(auth.uid()));

-- FINANCIAL_TRANSACTIONS TABLE POLICIES
-- Users can view transactions related to their reservations
CREATE POLICY "Users can view own transaction history" ON financial_transactions
    FOR SELECT USING (
        reservation_id IN (
            SELECT id FROM reservations WHERE user_id = auth.uid()
        )
    );

-- Staff and above can view all transactions
CREATE POLICY "Staff can view all transactions" ON financial_transactions
    FOR SELECT USING (is_staff_or_higher(auth.uid()));

-- Staff and above can manage transactions
CREATE POLICY "Staff can manage transactions" ON financial_transactions
    FOR ALL USING (is_staff_or_higher(auth.uid()));

-- EVENTS TABLE POLICIES
-- Everyone can view active events
CREATE POLICY "Everyone can view active events" ON events
    FOR SELECT USING (is_active = true OR is_staff_or_higher(auth.uid()));

-- Staff and above can manage events
CREATE POLICY "Staff can manage events" ON events
    FOR ALL USING (is_staff_or_higher(auth.uid()));

-- ALBUMS TABLE POLICIES
-- Everyone can view active albums
CREATE POLICY "Everyone can view active albums" ON albums
    FOR SELECT USING (is_active = true OR is_staff_or_higher(auth.uid()));

-- Staff and above can manage albums
CREATE POLICY "Staff can manage albums" ON albums
    FOR ALL USING (is_staff_or_higher(auth.uid()));

-- PHOTOS TABLE POLICIES
-- Everyone can view photos from active albums
CREATE POLICY "Everyone can view photos" ON photos
    FOR SELECT USING (
        is_active = true AND 
        album_id IN (SELECT id FROM albums WHERE is_active = true)
        OR is_staff_or_higher(auth.uid())
    );

-- Staff and above can manage photos
CREATE POLICY "Staff can manage photos" ON photos
    FOR ALL USING (is_staff_or_higher(auth.uid()));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'customer'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant limited permissions to anonymous users
GRANT SELECT ON venue_types TO anon;
GRANT SELECT ON venues TO anon;
GRANT SELECT ON venue_time_slots TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON albums TO anon;
GRANT SELECT ON photos TO anon;