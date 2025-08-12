-- Database Functions for Business Logic
-- Migration: Core business functions

-- Function to generate unique reservation code
CREATE OR REPLACE FUNCTION generate_reservation_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN := TRUE;
BEGIN
    WHILE exists LOOP
        code := 'OSC' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        SELECT COUNT(*) > 0 INTO exists FROM reservations WHERE reservation_code = code;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate venue price based on date and time
CREATE OR REPLACE FUNCTION calculate_venue_price(
    p_venue_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_duration_hours DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    base_price DECIMAL;
    weekend_price DECIMAL;
    time_multiplier DECIMAL := 1.0;
    is_weekend BOOLEAN;
    final_price DECIMAL;
BEGIN
    -- Get venue pricing
    SELECT v.base_price, v.weekend_price
    INTO base_price, weekend_price
    FROM venues v
    WHERE v.id = p_venue_id AND v.is_active = true;
    
    IF base_price IS NULL THEN
        RAISE EXCEPTION 'Venue not found or inactive';
    END IF;
    
    -- Check if it's weekend (Saturday = 6, Sunday = 0)
    is_weekend := EXTRACT(DOW FROM p_date) IN (0, 6);
    
    -- Get time slot multiplier if exists
    SELECT COALESCE(vts.price_multiplier, 1.0)
    INTO time_multiplier
    FROM venue_time_slots vts
    WHERE vts.venue_id = p_venue_id 
    AND vts.start_time <= p_start_time 
    AND vts.end_time > p_start_time
    AND vts.is_available = true
    LIMIT 1;
    
    -- Calculate final price
    IF is_weekend AND weekend_price IS NOT NULL THEN
        final_price := weekend_price * time_multiplier * p_duration_hours;
    ELSE
        final_price := base_price * time_multiplier * p_duration_hours;
    END IF;
    
    RETURN ROUND(final_price, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to check venue availability
CREATE OR REPLACE FUNCTION check_venue_availability(
    p_venue_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check for time conflicts with existing reservations
    SELECT COUNT(*)
    INTO conflict_count
    FROM reservations r
    WHERE r.venue_id = p_venue_id
    AND r.reservation_date = p_date
    AND r.status IN ('confirmed', 'pending')
    AND (
        (r.start_time < p_end_time AND r.end_time > p_start_time)
    )
    AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id);
    
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get available time slots for a venue on a specific date
CREATE OR REPLACE FUNCTION get_available_time_slots(
    p_venue_id UUID,
    p_date DATE
)
RETURNS TABLE(
    slot_id UUID,
    start_time TIME,
    end_time TIME,
    price_multiplier DECIMAL,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vts.id,
        vts.start_time,
        vts.end_time,
        vts.price_multiplier,
        (
            vts.is_available AND 
            check_venue_availability(p_venue_id, p_date, vts.start_time, vts.end_time)
        ) as is_available
    FROM venue_time_slots vts
    WHERE vts.venue_id = p_venue_id
    ORDER BY vts.start_time;
END;
$$ LANGUAGE plpgsql;

-- Function to create a reservation with validation
CREATE OR REPLACE FUNCTION create_reservation(
    p_user_id UUID,
    p_venue_id UUID,
    p_venue_time_slot_id UUID,
    p_reservation_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_duration_hours DECIMAL,
    p_discount_percentage DECIMAL DEFAULT 0,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    reservation_id UUID;
    base_price DECIMAL;
    total_price DECIMAL;
    reservation_code TEXT;
BEGIN
    -- Validate venue exists and is active
    IF NOT EXISTS (SELECT 1 FROM venues WHERE id = p_venue_id AND is_active = true) THEN
        RAISE EXCEPTION 'Venue not found or inactive';
    END IF;
    
    -- Validate time slot exists and is available
    IF NOT EXISTS (
        SELECT 1 FROM venue_time_slots 
        WHERE id = p_venue_time_slot_id 
        AND venue_id = p_venue_id 
        AND is_available = true
    ) THEN
        RAISE EXCEPTION 'Time slot not available';
    END IF;
    
    -- Check availability
    IF NOT check_venue_availability(p_venue_id, p_reservation_date, p_start_time, p_end_time) THEN
        RAISE EXCEPTION 'Time slot is already booked';
    END IF;
    
    -- Calculate pricing
    base_price := calculate_venue_price(p_venue_id, p_reservation_date, p_start_time, p_duration_hours);
    total_price := base_price * (1 - p_discount_percentage / 100);
    
    -- Generate reservation code
    reservation_code := generate_reservation_code();
    
    -- Create reservation
    INSERT INTO reservations (
        reservation_code,
        user_id,
        venue_id,
        venue_time_slot_id,
        reservation_date,
        start_time,
        end_time,
        duration_hours,
        base_price,
        discount_percentage,
        total_price,
        notes
    ) VALUES (
        reservation_code,
        p_user_id,
        p_venue_id,
        p_venue_time_slot_id,
        p_reservation_date,
        p_start_time,
        p_end_time,
        p_duration_hours,
        base_price,
        p_discount_percentage,
        total_price,
        p_notes
    ) RETURNING id INTO reservation_id;
    
    RETURN reservation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update reservation status
CREATE OR REPLACE FUNCTION update_reservation_status(
    p_reservation_id UUID,
    p_status reservation_status,
    p_payment_status payment_status DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE reservations 
    SET 
        status = p_status,
        payment_status = COALESCE(p_payment_status, payment_status),
        updated_at = NOW()
    WHERE id = p_reservation_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get venue statistics
CREATE OR REPLACE FUNCTION get_venue_statistics(
    p_venue_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    total_reservations BIGINT,
    confirmed_reservations BIGINT,
    cancelled_reservations BIGINT,
    total_revenue DECIMAL,
    average_booking_value DECIMAL,
    utilization_rate DECIMAL
) AS $$
DECLARE
    start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
    end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_reservations,
        COUNT(*) FILTER (WHERE r.status = 'confirmed') as confirmed_reservations,
        COUNT(*) FILTER (WHERE r.status = 'cancelled') as cancelled_reservations,
        COALESCE(SUM(r.total_price) FILTER (WHERE r.status = 'confirmed'), 0) as total_revenue,
        COALESCE(AVG(r.total_price) FILTER (WHERE r.status = 'confirmed'), 0) as average_booking_value,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE r.status = 'confirmed')::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END as utilization_rate
    FROM reservations r
    WHERE r.venue_id = p_venue_id
    AND r.reservation_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get financial summary
CREATE OR REPLACE FUNCTION get_financial_summary(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    total_income DECIMAL,
    total_expense DECIMAL,
    net_profit DECIMAL,
    transaction_count BIGINT
) AS $$
DECLARE
    start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
    end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type = 'income'), 0) as total_income,
        COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type = 'expense'), 0) as total_expense,
        COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type = 'income'), 0) - 
        COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type = 'expense'), 0) as net_profit,
        COUNT(*) as transaction_count
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel reservation
CREATE OR REPLACE FUNCTION cancel_reservation(
    p_reservation_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    reservation_exists BOOLEAN;
    user_owns_reservation BOOLEAN;
BEGIN
    -- Check if reservation exists and user owns it (or user is staff+)
    SELECT 
        EXISTS(SELECT 1 FROM reservations WHERE id = p_reservation_id),
        EXISTS(
            SELECT 1 FROM reservations r
            JOIN profiles p ON p.id = p_user_id
            WHERE r.id = p_reservation_id 
            AND (r.user_id = p_user_id OR p.role IN ('staff', 'admin', 'superadmin'))
        )
    INTO reservation_exists, user_owns_reservation;
    
    IF NOT reservation_exists THEN
        RAISE EXCEPTION 'Reservation not found';
    END IF;
    
    IF NOT user_owns_reservation THEN
        RAISE EXCEPTION 'Unauthorized to cancel this reservation';
    END IF;
    
    -- Update reservation status
    UPDATE reservations 
    SET 
        status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_reservation_id
    AND status IN ('pending', 'confirmed');
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for function performance
CREATE INDEX IF NOT EXISTS idx_reservations_venue_date_time ON reservations(venue_id, reservation_date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status_payment ON reservations(status, payment_status);
CREATE INDEX IF NOT EXISTS idx_venue_time_slots_venue_time ON venue_time_slots(venue_id, start_time, end_time);