-- Sample Data for Orange Sport Center
-- Migration: Initial sample data

-- Insert venue types
INSERT INTO venue_types (id, name, description, icon) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Futsal', 'Indoor futsal courts with synthetic grass', 'futsal'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Basketball', 'Indoor basketball courts with wooden floors', 'basketball'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Mini Soccer', 'Outdoor mini soccer fields with natural grass', 'soccer'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Badminton', 'Indoor badminton courts with proper lighting', 'badminton'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Tennis', 'Outdoor tennis courts with hard surface', 'tennis');

-- Insert venues
INSERT INTO venues (id, venue_type_id, name, description, capacity, base_price, weekend_price, facilities, rules, is_active) VALUES
    (
        '660e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440001',
        'Futsal Court A',
        'Premium futsal court with high-quality synthetic grass and professional lighting',
        12,
        150000.00,
        180000.00,
        ARRAY['Air Conditioning', 'Sound System', 'Changing Room', 'Parking', 'Drinking Water'],
        'No smoking, No outside food/drinks, Proper sports attire required, Maximum 12 players',
        true
    ),
    (
        '660e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440001',
        'Futsal Court B',
        'Standard futsal court with good lighting and ventilation',
        12,
        130000.00,
        160000.00,
        ARRAY['Changing Room', 'Parking', 'Drinking Water'],
        'No smoking, No outside food/drinks, Proper sports attire required, Maximum 12 players',
        true
    ),
    (
        '660e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440002',
        'Basketball Court',
        'Full-size basketball court with wooden floor and adjustable hoops',
        10,
        120000.00,
        150000.00,
        ARRAY['Air Conditioning', 'Sound System', 'Changing Room', 'Parking', 'Drinking Water', 'Scoreboard'],
        'No smoking, No outside food/drinks, Proper sports attire required, Maximum 10 players',
        true
    ),
    (
        '660e8400-e29b-41d4-a716-446655440004',
        '550e8400-e29b-41d4-a716-446655440003',
        'Mini Soccer Field',
        'Outdoor mini soccer field with natural grass and goal posts',
        16,
        200000.00,
        250000.00,
        ARRAY['Changing Room', 'Parking', 'Drinking Water', 'Floodlights'],
        'No smoking, No outside food/drinks, Proper sports attire required, Maximum 16 players',
        true
    ),
    (
        '660e8400-e29b-41d4-a716-446655440005',
        '550e8400-e29b-41d4-a716-446655440004',
        'Badminton Court 1',
        'Indoor badminton court with professional lighting and ventilation',
        4,
        80000.00,
        100000.00,
        ARRAY['Air Conditioning', 'Changing Room', 'Parking', 'Drinking Water', 'Equipment Rental'],
        'No smoking, No outside food/drinks, Proper sports attire required, Maximum 4 players',
        true
    ),
    (
        '660e8400-e29b-41d4-a716-446655440006',
        '550e8400-e29b-41d4-a716-446655440004',
        'Badminton Court 2',
        'Indoor badminton court with professional lighting and ventilation',
        4,
        80000.00,
        100000.00,
        ARRAY['Air Conditioning', 'Changing Room', 'Parking', 'Drinking Water', 'Equipment Rental'],
        'No smoking, No outside food/drinks, Proper sports attire required, Maximum 4 players',
        true
    );

-- Insert time slots for all venues (6 AM to 11 PM)
INSERT INTO venue_time_slots (venue_id, start_time, end_time, price_multiplier) 
SELECT 
    v.id,
    (hour_slot || ':00:00')::TIME as start_time,
    ((hour_slot + 1) || ':00:00')::TIME as end_time,
    CASE 
        WHEN hour_slot BETWEEN 6 AND 8 THEN 0.8  -- Early morning discount
        WHEN hour_slot BETWEEN 9 AND 16 THEN 1.0  -- Regular hours
        WHEN hour_slot BETWEEN 17 AND 20 THEN 1.3  -- Peak hours
        WHEN hour_slot BETWEEN 21 AND 23 THEN 1.1  -- Evening hours
        ELSE 1.0
    END as price_multiplier
FROM venues v
CROSS JOIN generate_series(6, 22) as hour_slot;

-- Insert sample events
INSERT INTO events (id, title, description, event_date, start_time, end_time, venue_id, is_active) VALUES
    (
        '770e8400-e29b-41d4-a716-446655440001',
        'Grand Opening Tournament',
        'Join our grand opening futsal tournament with exciting prizes!',
        CURRENT_DATE + INTERVAL '7 days',
        '09:00:00',
        '17:00:00',
        '660e8400-e29b-41d4-a716-446655440001',
        true
    ),
    (
        '770e8400-e29b-41d4-a716-446655440002',
        'Basketball Skills Workshop',
        'Learn basketball fundamentals from professional coaches',
        CURRENT_DATE + INTERVAL '14 days',
        '10:00:00',
        '15:00:00',
        '660e8400-e29b-41d4-a716-446655440003',
        true
    ),
    (
        '770e8400-e29b-41d4-a716-446655440003',
        'Weekend Soccer League',
         'Weekly soccer league for all skill levels',
        CURRENT_DATE + INTERVAL '21 days',
        '08:00:00',
        '18:00:00',
        '660e8400-e29b-41d4-a716-446655440004',
        true
    );

-- Insert sample albums
INSERT INTO albums (id, title, description, is_active) VALUES
    (
        '880e8400-e29b-41d4-a716-446655440001',
        'Facility Gallery',
        'Photos of our modern sports facilities and amenities',
        true
    ),
    (
        '880e8400-e29b-41d4-a716-446655440002',
        'Tournament Highlights',
        'Memorable moments from our tournaments and events',
        true
    ),
    (
        '880e8400-e29b-41d4-a716-446655440003',
        'Customer Activities',
        'Our customers enjoying their time at Orange Sport Center',
        true
    );

-- Insert sample photos
INSERT INTO photos (album_id, title, description, image_url, sort_order, is_active) VALUES
    (
        '880e8400-e29b-41d4-a716-446655440001',
        'Futsal Court A',
        'Our premium futsal court with professional lighting',
        '/images/venues/futsal-court-a.jpg',
        1,
        true
    ),
    (
        '880e8400-e29b-41d4-a716-446655440001',
        'Basketball Court',
        'Full-size basketball court with wooden floor',
        '/images/venues/basketball-court.jpg',
        2,
        true
    ),
    (
        '880e8400-e29b-41d4-a716-446655440001',
        'Mini Soccer Field',
        'Outdoor mini soccer field with natural grass',
        '/images/venues/mini-soccer-field.jpg',
        3,
        true
    ),
    (
        '880e8400-e29b-41d4-a716-446655440001',
        'Badminton Courts',
        'Professional badminton courts with proper lighting',
        '/images/venues/badminton-courts.jpg',
        4,
        true
    ),
    (
        '880e8400-e29b-41d4-a716-446655440002',
        'Tournament Action',
        'Exciting moments from our futsal tournament',
        '/images/events/tournament-action.jpg',
        1,
        true
    ),
    (
        '880e8400-e29b-41d4-a716-446655440002',
        'Winners Celebration',
        'Tournament winners celebrating their victory',
        '/images/events/winners-celebration.jpg',
        2,
        true
    ),
    (
        '880e8400-e29b-41d4-a716-446655440003',
        'Happy Customers',
        'Customers enjoying their game time',
        '/images/customers/happy-customers.jpg',
        1,
        true
    );

-- Note: The following would typically be handled by the application
-- when a real user signs up, but we're including it here for testing
-- You would replace this with actual user data from your authentication system

-- Sample admin user profile (this would be created automatically via trigger)
-- The actual user creation should be done through Supabase Auth
-- This is just for reference of what the profile would look like

/*
Example of how to create an admin user through Supabase Auth:
1. Sign up through your application or Supabase dashboard
2. Get the user ID from auth.users table
3. Update the profile role to 'admin' or 'superadmin'

INSERT INTO profiles (id, full_name, phone, role, is_active) VALUES
(
    'user-id-from-auth-users-table',
    'Admin User',
    '+62812345678',
    'superadmin',
    true
);
*/

-- Create some sample financial transactions (for demonstration)
-- These would typically be created when reservations are made and payments processed
INSERT INTO financial_transactions (transaction_type, amount, description, transaction_date, payment_method, reference_number) VALUES
    ('income', 150000.00, 'Futsal Court A booking - Sample transaction', CURRENT_DATE - INTERVAL '1 day', 'Bank Transfer', 'TXN001'),
    ('income', 120000.00, 'Basketball Court booking - Sample transaction', CURRENT_DATE - INTERVAL '2 days', 'Cash', 'TXN002'),
    ('income', 200000.00, 'Mini Soccer Field booking - Sample transaction', CURRENT_DATE - INTERVAL '3 days', 'E-Wallet', 'TXN003'),
    ('expense', 50000.00, 'Equipment maintenance', CURRENT_DATE - INTERVAL '1 day', 'Cash', 'EXP001'),
    ('expense', 75000.00, 'Facility cleaning supplies', CURRENT_DATE - INTERVAL '2 days', 'Bank Transfer', 'EXP002');

-- Update album cover images
UPDATE albums SET cover_image_url = '/images/venues/futsal-court-a.jpg' WHERE id = '880e8400-e29b-41d4-a716-446655440001';
UPDATE albums SET cover_image_url = '/images/events/tournament-action.jpg' WHERE id = '880e8400-e29b-41d4-a716-446655440002';
UPDATE albums SET cover_image_url = '/images/customers/happy-customers.jpg' WHERE id = '880e8400-e29b-41d4-a716-446655440003';

-- Update event images
UPDATE events SET image_url = '/images/events/grand-opening.jpg' WHERE id = '770e8400-e29b-41d4-a716-446655440001';
UPDATE events SET image_url = '/images/events/basketball-workshop.jpg' WHERE id = '770e8400-e29b-41d4-a716-446655440002';
UPDATE events SET image_url = '/images/events/soccer-league.jpg' WHERE id = '770e8400-e29b-41d4-a716-446655440003';

-- Update venue images
UPDATE venues SET image_url = '/images/venues/futsal-court-a.jpg' WHERE id = '660e8400-e29b-41d4-a716-446655440001';
UPDATE venues SET image_url = '/images/venues/futsal-court-b.jpg' WHERE id = '660e8400-e29b-41d4-a716-446655440002';
UPDATE venues SET image_url = '/images/venues/basketball-court.jpg' WHERE id = '660e8400-e29b-41d4-a716-446655440003';
UPDATE venues SET image_url = '/images/venues/mini-soccer-field.jpg' WHERE id = '660e8400-e29b-41d4-a716-446655440004';
UPDATE venues SET image_url = '/images/venues/badminton-court-1.jpg' WHERE id = '660e8400-e29b-41d4-a716-446655440005';
UPDATE venues SET image_url = '/images/venues/badminton-court-2.jpg' WHERE id = '660e8400-e29b-41d4-a716-446655440006';