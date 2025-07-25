/*
  # Final System Update - Complete Database Schema

  1. Database Updates
    - Ensure all tables exist with proper structure
    - Add missing constraints and indexes
    - Update existing data to be consistent

  2. Data Integrity
    - Proper foreign key constraints for delete operations
    - Check constraints for data validation
    - Indexes for performance

  3. Sample Data
    - Add comprehensive sample data for testing
    - Ensure all relationships work properly
*/

-- Ensure all tables exist with proper structure
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'technician', 'accountant')),
  name text NOT NULL,
  email text,
  phone text,
  is_active boolean DEFAULT true,
  can_view_prices boolean DEFAULT false,
  photo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  logo text,
  current_balance decimal(10,2) DEFAULT 0,
  total_debt decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  phone text,
  email text,
  photo text,
  current_balance decimal(10,2) DEFAULT 0,
  total_debt decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prosthesis_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_price decimal(10,2) NOT NULL DEFAULT 0,
  model_price decimal(10,2) DEFAULT 0,
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  monthly_quota integer DEFAULT 0,
  completed_jobs integer DEFAULT 0,
  salary decimal(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  photo text,
  phone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text UNIQUE NOT NULL,
  patient_name text NOT NULL,
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  prosthesis_type_id uuid REFERENCES prosthesis_types(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in-progress', 'completed', 'delivered', 'geçici-prova', 'metal-prova', 'kapanışa-gitti', 'parça-bekliyor')),
  technician_id uuid REFERENCES technicians(id),
  arrival_date timestamptz NOT NULL,
  delivery_date timestamptz NOT NULL,
  completion_date timestamptz,
  actual_delivery_date timestamptz,
  notes text,
  cost decimal(10,2) DEFAULT 0,
  unit_count integer NOT NULL DEFAULT 1,
  total_price decimal(10,2) NOT NULL DEFAULT 0,
  final_price decimal(10,2),
  discount_amount decimal(10,2) DEFAULT 0,
  is_paid boolean DEFAULT false,
  is_digital_measurement boolean DEFAULT false,
  is_manual_measurement boolean DEFAULT false,
  has_model boolean DEFAULT false,
  custom_status text,
  work_stage text CHECK (work_stage IN ('geçici-prova', 'metal-prova', 'kapanışa-gitti', 'parça-bekliyor')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  supplier text,
  invoice_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id),
  amount decimal(10,2) NOT NULL,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('payment', 'debt')),
  description text NOT NULL,
  invoice_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints if they don't exist
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

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE prosthesis_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - Allow all operations for now (since we're using API keys)
DROP POLICY IF EXISTS "Allow all operations" ON users;
DROP POLICY IF EXISTS "Allow all operations" ON clinics;
DROP POLICY IF EXISTS "Allow all operations" ON doctors;
DROP POLICY IF EXISTS "Allow all operations" ON prosthesis_types;
DROP POLICY IF EXISTS "Allow all operations" ON technicians;
DROP POLICY IF EXISTS "Allow all operations" ON orders;
DROP POLICY IF EXISTS "Allow all operations" ON expenses;
DROP POLICY IF EXISTS "Allow all operations" ON payments;

CREATE POLICY "Allow all operations" ON users FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations" ON clinics FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations" ON doctors FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations" ON prosthesis_types FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations" ON technicians FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations" ON orders FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations" ON expenses FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations" ON payments FOR ALL TO anon USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_orders_doctor_id ON orders(doctor_id);
CREATE INDEX IF NOT EXISTS idx_orders_prosthesis_type_id ON orders(prosthesis_type_id);
CREATE INDEX IF NOT EXISTS idx_orders_technician_id ON orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_custom_status ON orders(custom_status);
CREATE INDEX IF NOT EXISTS idx_orders_work_stage ON orders(work_stage);
CREATE INDEX IF NOT EXISTS idx_orders_status_work_stage ON orders(status, work_stage);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_date, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_delivery_date ON orders(status, delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_arrival_date ON orders(arrival_date);
CREATE INDEX IF NOT EXISTS idx_orders_actual_delivery_date ON orders(actual_delivery_date);
CREATE INDEX IF NOT EXISTS idx_payments_doctor_id ON payments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Add search indexes
CREATE INDEX IF NOT EXISTS idx_orders_patient_name ON orders USING gin(to_tsvector('turkish', patient_name));
CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors USING gin(to_tsvector('turkish', name));
CREATE INDEX IF NOT EXISTS idx_clinics_name ON clinics USING gin(to_tsvector('turkish', name));

-- Ensure barcode uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_barcode_unique ON orders(barcode);

-- Insert comprehensive sample data
INSERT INTO users (id, username, password, role, name, email, is_active, can_view_prices) VALUES
  ('550e8400-e29b-41d4-a716-446655440041', 'admin', '123456', 'admin', 'Sistem Yöneticisi', 'admin@dentallab.com', true, true),
  ('550e8400-e29b-41d4-a716-446655440042', 'muhasebe', '123456', 'accountant', 'Fatma Kaya', 'muhasebe@dentallab.com', true, true),
  ('550e8400-e29b-41d4-a716-446655440043', 'teknisyen', '123456', 'technician', 'Ahmet Yılmaz', 'teknisyen@dentallab.com', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO clinics (id, name, address, phone, email, current_balance, total_debt) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Dental Plus Kliniği', 'Merkez Mah. Atatürk Cad. No:123 Kadıköy/İstanbul', '0212 555 0101', 'info@dentalplus.com', 15000, 25000),
  ('550e8400-e29b-41d4-a716-446655440002', 'Smile Center', 'Yeni Mah. İstiklal Cad. No:456 Beşiktaş/İstanbul', '0212 555 0202', 'info@smilecenter.com', 8500, 12000),
  ('550e8400-e29b-41d4-a716-446655440003', 'Oral Care Kliniği', 'Çamlık Sok. No:78 Şişli/İstanbul', '0212 555 0303', 'info@oralcare.com', 12000, 18000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, name, clinic_id, phone, email, current_balance, total_debt) VALUES
  ('550e8400-e29b-41d4-a716-446655440011', 'Dr. Mehmet Özkan', '550e8400-e29b-41d4-a716-446655440001', '0532 111 2233', 'mehmet.ozkan@dentalplus.com', 5000, 8000),
  ('550e8400-e29b-41d4-a716-446655440012', 'Dr. Ayşe Demir', '550e8400-e29b-41d4-a716-446655440001', '0532 111 2244', 'ayse.demir@dentalplus.com', 10000, 17000),
  ('550e8400-e29b-41d4-a716-446655440013', 'Dr. Ali Çelik', '550e8400-e29b-41d4-a716-446655440002', '0532 111 2255', 'ali.celik@smilecenter.com', 8500, 12000),
  ('550e8400-e29b-41d4-a716-446655440014', 'Dr. Zeynep Kaya', '550e8400-e29b-41d4-a716-446655440002', '0532 111 2266', 'zeynep.kaya@smilecenter.com', 6000, 9000),
  ('550e8400-e29b-41d4-a716-446655440015', 'Dr. Can Yılmaz', '550e8400-e29b-41d4-a716-446655440003', '0532 111 2277', 'can.yilmaz@oralcare.com', 7500, 11000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO prosthesis_types (id, name, base_price, model_price, category) VALUES
  ('550e8400-e29b-41d4-a716-446655440021', 'Zirkonyum Kuron', 800, 150, 'Kuron'),
  ('550e8400-e29b-41d4-a716-446655440022', 'E-Max Kuron', 600, 150, 'Kuron'),
  ('550e8400-e29b-41d4-a716-446655440023', 'Metal Destekli Porselen', 400, 150, 'Kuron'),
  ('550e8400-e29b-41d4-a716-446655440024', 'Tam Protez', 1200, 200, 'Protez'),
  ('550e8400-e29b-41d4-a716-446655440025', 'Parsiyel Protez', 800, 180, 'Protez'),
  ('550e8400-e29b-41d4-a716-446655440026', 'İmplant Üstü Kuron', 1000, 160, 'İmplant'),
  ('550e8400-e29b-41d4-a716-446655440027', 'Laminat Veneer', 700, 120, 'Estetik'),
  ('550e8400-e29b-41d4-a716-446655440028', 'İnlay/Onlay', 500, 100, 'Restoratif')
ON CONFLICT (id) DO NOTHING;

INSERT INTO technicians (id, name, username, password, monthly_quota, completed_jobs, salary, is_active, phone, email) VALUES
  ('550e8400-e29b-41d4-a716-446655440031', 'Ahmet Yılmaz', 'teknisyen1', '123456', 100, 45, 25000, true, '0532 333 4455', 'ahmet@dentallab.com'),
  ('550e8400-e29b-41d4-a716-446655440032', 'Elif Kaya', 'teknisyen2', '123456', 80, 38, 22000, true, '0532 333 4466', 'elif@dentallab.com'),
  ('550e8400-e29b-41d4-a716-446655440033', 'Murat Demir', 'teknisyen3', '123456', 90, 42, 24000, true, '0532 333 4477', 'murat@dentallab.com')
ON CONFLICT (id) DO NOTHING;

-- Insert sample orders with various statuses
INSERT INTO orders (id, barcode, patient_name, doctor_id, prosthesis_type_id, status, technician_id, arrival_date, delivery_date, unit_count, total_price, is_digital_measurement, is_manual_measurement, has_model, work_stage) VALUES
  ('550e8400-e29b-41d4-a716-446655440061', 'BL2025010001', 'Ahmet Yılmaz', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440021', 'waiting', null, now() - interval '1 day', now() + interval '5 days', 2, 1600, true, false, false, null),
  ('550e8400-e29b-41d4-a716-446655440062', 'BL2025010002', 'Fatma Özkan', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440022', 'in-progress', '550e8400-e29b-41d4-a716-446655440031', now() - interval '3 days', now() + interval '3 days', 1, 600, false, true, false, null),
  ('550e8400-e29b-41d4-a716-446655440063', 'BL2025010003', 'Mehmet Kaya', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440023', 'geçici-prova', '550e8400-e29b-41d4-a716-446655440032', now() - interval '5 days', now() + interval '2 days', 3, 1200, true, false, true, 'geçici-prova'),
  ('550e8400-e29b-41d4-a716-446655440064', 'BL2025010004', 'Ayşe Demir', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440024', 'metal-prova', '550e8400-e29b-41d4-a716-446655440033', now() - interval '7 days', now() + interval '1 day', 1, 1200, false, true, true, 'metal-prova'),
  ('550e8400-e29b-41d4-a716-446655440065', 'BL2025010005', 'Can Yılmaz', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440025', 'kapanışa-gitti', '550e8400-e29b-41d4-a716-446655440031', now() - interval '10 days', now() - interval '1 day', 2, 1600, true, true, false, 'kapanışa-gitti'),
  ('550e8400-e29b-41d4-a716-446655440066', 'BL2025010006', 'Zeynep Özkan', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440026', 'parça-bekliyor', '550e8400-e29b-41d4-a716-446655440032', now() - interval '4 days', now() + interval '4 days', 1, 1000, false, false, true, 'parça-bekliyor'),
  ('550e8400-e29b-41d4-a716-446655440067', 'BL2025010007', 'Ali Kaya', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440027', 'completed', '550e8400-e29b-41d4-a716-446655440033', now() - interval '8 days', now() + interval '1 day', 4, 2800, true, false, false, null),
  ('550e8400-e29b-41d4-a716-446655440068', 'BL2025010008', 'Sema Demir', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440028', 'delivered', '550e8400-e29b-41d4-a716-446655440031', now() - interval '12 days', now() - interval '2 days', 2, 1000, false, true, true, null),
  ('550e8400-e29b-41d4-a716-446655440069', 'BL2025010009', 'Hasan Yılmaz', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440021', 'waiting', null, now(), now() + interval '6 days', 1, 800, true, false, false, null),
  ('550e8400-e29b-41d4-a716-446655440070', 'BL2025010010', 'Elif Özkan', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440022', 'in-progress', '550e8400-e29b-41d4-a716-446655440032', now() - interval '2 days', now() + interval '4 days', 3, 1800, false, true, true, null)
ON CONFLICT (id) DO NOTHING;

INSERT INTO expenses (id, date, category, description, amount, supplier, invoice_number) VALUES
  ('550e8400-e29b-41d4-a716-446655440051', '2025-01-01', 'Malzeme', 'Zirkonyum Blok', 2500, 'Dental Malzeme A.Ş.', 'FM-2025-001'),
  ('550e8400-e29b-41d4-a716-446655440052', '2025-01-02', 'Ekipman', 'Fırın Bakımı', 800, 'Teknik Servis Ltd.', 'TS-2025-005'),
  ('550e8400-e29b-41d4-a716-446655440053', '2025-01-03', 'Kira', 'Atölye Kirası', 5000, 'Emlak Yönetim A.Ş.', 'KR-2025-001'),
  ('550e8400-e29b-41d4-a716-446655440054', '2025-01-04', 'Elektrik', 'Elektrik Faturası', 1200, 'BEDAŞ', 'EL-2025-001'),
  ('550e8400-e29b-41d4-a716-446655440055', '2025-01-05', 'Malzeme', 'Porselen Tozu', 1800, 'Dental Malzeme A.Ş.', 'FM-2025-002')
ON CONFLICT (id) DO NOTHING;

-- Update statistics for better query planning
ANALYZE orders;
ANALYZE doctors;
ANALYZE clinics;
ANALYZE prosthesis_types;
ANALYZE technicians;
ANALYZE users;
ANALYZE expenses;
ANALYZE payments;