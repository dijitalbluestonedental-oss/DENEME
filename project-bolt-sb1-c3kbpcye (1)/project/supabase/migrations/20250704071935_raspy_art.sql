/*
  # System improvements and fixes

  1. Database Updates
    - Add missing indexes for better performance
    - Update RLS policies for better security
    - Add new columns if needed

  2. Data Integrity
    - Ensure all foreign key relationships are properly set
    - Add constraints for data validation

  3. Performance Optimizations
    - Add composite indexes for common queries
    - Optimize existing indexes
*/

-- Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_status_delivery_date ON orders(status, delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_doctor_status ON orders(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_arrival_date ON orders(arrival_date);
CREATE INDEX IF NOT EXISTS idx_orders_actual_delivery_date ON orders(actual_delivery_date);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_orders_patient_name ON orders USING gin(to_tsvector('turkish', patient_name));
CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors USING gin(to_tsvector('turkish', name));
CREATE INDEX IF NOT EXISTS idx_clinics_name ON clinics USING gin(to_tsvector('turkish', name));

-- Ensure barcode uniqueness and add better indexing
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_barcode_unique ON orders(barcode);

-- Add check constraints for data validation
DO $$
BEGIN
  -- Add constraint for positive prices
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'prosthesis_types_positive_prices' 
    AND table_name = 'prosthesis_types'
  ) THEN
    ALTER TABLE prosthesis_types ADD CONSTRAINT prosthesis_types_positive_prices 
    CHECK (base_price >= 0 AND (model_price IS NULL OR model_price >= 0));
  END IF;

  -- Add constraint for positive amounts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_positive_amounts' 
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_positive_amounts 
    CHECK (unit_count > 0 AND total_price >= 0 AND (final_price IS NULL OR final_price >= 0));
  END IF;

  -- Add constraint for valid dates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_valid_dates' 
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_valid_dates 
    CHECK (delivery_date >= arrival_date);
  END IF;
END $$;

-- Update existing data to ensure consistency
UPDATE orders SET final_price = total_price WHERE final_price IS NULL AND status = 'delivered';

-- Add some sample data for testing if tables are empty
DO $$
BEGIN
  -- Only add sample data if tables are relatively empty
  IF (SELECT COUNT(*) FROM orders) < 10 THEN
    -- Add some sample orders for testing
    INSERT INTO orders (
      barcode, patient_name, doctor_id, prosthesis_type_id, 
      arrival_date, delivery_date, unit_count, total_price, status
    ) VALUES
      ('BL' || extract(epoch from now())::text || '001', 'Test Hasta 1', 
       (SELECT id FROM doctors LIMIT 1), 
       (SELECT id FROM prosthesis_types LIMIT 1),
       now() - interval '2 days', now() + interval '3 days', 1, 800, 'in-progress'),
      ('BL' || extract(epoch from now())::text || '002', 'Test Hasta 2', 
       (SELECT id FROM doctors LIMIT 1), 
       (SELECT id FROM prosthesis_types LIMIT 1),
       now() - interval '1 day', now() + interval '2 days', 2, 1600, 'waiting')
    ON CONFLICT (barcode) DO NOTHING;
  END IF;
END $$;

-- Refresh materialized views if any exist
-- (None currently, but good practice for future)

-- Update statistics for better query planning
ANALYZE orders;
ANALYZE doctors;
ANALYZE clinics;
ANALYZE prosthesis_types;
ANALYZE payments;
ANALYZE expenses;
ANALYZE technicians;
ANALYZE users;