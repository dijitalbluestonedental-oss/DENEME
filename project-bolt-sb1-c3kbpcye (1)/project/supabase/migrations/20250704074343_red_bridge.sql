/*
  # Enhanced System with Custom Statuses and Logo Support

  1. New Features
    - Add custom status fields to orders table
    - Add work stage tracking
    - Support for custom order statuses
    - Enhanced indexing for better performance

  2. Database Updates
    - Add custom_status column to orders
    - Add work_stage column for special workflow states
    - Update constraints and indexes
    - Add sample data for testing

  3. Performance Improvements
    - Additional indexes for filtering and searching
    - Optimized queries for calendar views
*/

-- Add new columns to orders table for custom statuses
DO $$
BEGIN
  -- Add custom_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'custom_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN custom_status text;
  END IF;

  -- Add work_stage column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'work_stage'
  ) THEN
    ALTER TABLE orders ADD COLUMN work_stage text CHECK (work_stage IN ('geçici-prova', 'metal-prova', 'kapanışa-gitti', 'parça-bekliyor'));
  END IF;
END $$;

-- Update status check constraint to include new statuses
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_status_check' 
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  END IF;

  -- Add updated constraint with new statuses
  ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('waiting', 'in-progress', 'completed', 'delivered', 'geçici-prova', 'metal-prova', 'kapanışa-gitti', 'parça-bekliyor'));
END $$;

-- Add indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_orders_custom_status ON orders(custom_status);
CREATE INDEX IF NOT EXISTS idx_orders_work_stage ON orders(work_stage);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_status_work_stage ON orders(status, work_stage);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_date, status);

-- Update existing orders to have proper final_price if missing
UPDATE orders 
SET final_price = total_price 
WHERE final_price IS NULL AND status = 'delivered';

-- Add some sample orders with new statuses for testing
DO $$
BEGIN
  -- Only add if we have few orders
  IF (SELECT COUNT(*) FROM orders) < 15 THEN
    INSERT INTO orders (
      barcode, patient_name, doctor_id, prosthesis_type_id, 
      arrival_date, delivery_date, unit_count, total_price, 
      status, work_stage
    ) VALUES
      ('BL' || extract(epoch from now())::text || '003', 'Test Hasta 3', 
       (SELECT id FROM doctors LIMIT 1), 
       (SELECT id FROM prosthesis_types LIMIT 1),
       now() - interval '3 days', now() + interval '1 day', 1, 800, 'geçici-prova', 'geçici-prova'),
      ('BL' || extract(epoch from now())::text || '004', 'Test Hasta 4', 
       (SELECT id FROM doctors LIMIT 1), 
       (SELECT id FROM prosthesis_types LIMIT 1),
       now() - interval '4 days', now() + interval '2 days', 1, 600, 'metal-prova', 'metal-prova'),
      ('BL' || extract(epoch from now())::text || '005', 'Test Hasta 5', 
       (SELECT id FROM doctors LIMIT 1), 
       (SELECT id FROM prosthesis_types LIMIT 1),
       now() - interval '5 days', now() + interval '1 day', 2, 1200, 'parça-bekliyor', 'parça-bekliyor')
    ON CONFLICT (barcode) DO NOTHING;
  END IF;
END $$;

-- Create a function to get order status display name
CREATE OR REPLACE FUNCTION get_order_status_display(status_value text)
RETURNS text AS $$
BEGIN
  RETURN CASE status_value
    WHEN 'waiting' THEN 'Bekliyor'
    WHEN 'in-progress' THEN 'Devam Ediyor'
    WHEN 'completed' THEN 'Tamamlandı'
    WHEN 'delivered' THEN 'Teslim Edildi'
    WHEN 'geçici-prova' THEN 'Geçici Prova'
    WHEN 'metal-prova' THEN 'Metal Prova'
    WHEN 'kapanışa-gitti' THEN 'Kapanışa Gitti'
    WHEN 'parça-bekliyor' THEN 'Parça Bekliyor'
    ELSE status_value
  END;
END;
$$ LANGUAGE plpgsql;

-- Create a view for enhanced order information
CREATE OR REPLACE VIEW orders_with_details AS
SELECT 
  o.*,
  d.name as doctor_name,
  c.name as clinic_name,
  pt.name as prosthesis_type_name,
  pt.base_price,
  pt.model_price,
  t.name as technician_name,
  get_order_status_display(o.status) as status_display,
  CASE 
    WHEN o.actual_delivery_date IS NOT NULL AND o.actual_delivery_date::date > o.delivery_date::date THEN true
    WHEN o.actual_delivery_date IS NULL AND o.delivery_date::date < CURRENT_DATE AND o.status != 'delivered' THEN true
    ELSE false
  END as is_overdue
FROM orders o
LEFT JOIN doctors d ON o.doctor_id = d.id
LEFT JOIN clinics c ON d.clinic_id = c.id
LEFT JOIN prosthesis_types pt ON o.prosthesis_type_id = pt.id
LEFT JOIN technicians t ON o.technician_id = t.id;

-- Update statistics for better query planning
ANALYZE orders;
ANALYZE doctors;
ANALYZE clinics;
ANALYZE prosthesis_types;

-- Add comment to document the new features
COMMENT ON COLUMN orders.custom_status IS 'Custom status for flexible workflow management';
COMMENT ON COLUMN orders.work_stage IS 'Specific work stage for detailed tracking (geçici-prova, metal-prova, kapanışa-gitti, parça-bekliyor)';