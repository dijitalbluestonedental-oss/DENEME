/*
  # Create dental lab management system schema

  1. New Tables
    - `clinics` - Dental clinics information
    - `doctors` - Doctors associated with clinics
    - `prosthesis_types` - Types of prosthesis with pricing
    - `technicians` - Lab technicians
    - `users` - System users with roles
    - `orders` - Prosthesis orders
    - `expenses` - Business expenses
    - `payments` - Payment records

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each role
    - Create indexes for performance
    - Add triggers for updated_at timestamps

  3. Initial Data
    - Sample clinics, doctors, prosthesis types
    - Default users and technicians
    - Sample expenses
*/

-- Create updated_at trigger function first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table (create first since other policies reference it)
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

-- Clinics table
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

-- Doctors table
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

-- Prosthesis types table
CREATE TABLE IF NOT EXISTS prosthesis_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_price decimal(10,2) NOT NULL DEFAULT 0,
  model_price decimal(10,2) DEFAULT 0,
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Technicians table
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

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text UNIQUE NOT NULL,
  patient_name text NOT NULL,
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  prosthesis_type_id uuid REFERENCES prosthesis_types(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in-progress', 'completed', 'delivered')),
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Expenses table
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

-- Payments table
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

-- Insert initial data first
INSERT INTO users (id, username, password, role, name, email, is_active, can_view_prices) VALUES
  ('550e8400-e29b-41d4-a716-446655440041', 'admin', '123456', 'admin', 'Sistem Yöneticisi', 'admin@dentallab.com', true, true),
  ('550e8400-e29b-41d4-a716-446655440042', 'muhasebe', '123456', 'accountant', 'Fatma Kaya', 'muhasebe@dentallab.com', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO clinics (id, name, address, phone, email, current_balance, total_debt) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'A Kliniği', 'Merkez Mah. Atatürk Cad. No:123', '0212 555 0101', 'info@aklinigi.com', 15000, 25000),
  ('550e8400-e29b-41d4-a716-446655440002', 'B Kliniği', 'Yeni Mah. İstiklal Cad. No:456', '0212 555 0202', 'info@bklinigi.com', 8500, 12000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, name, clinic_id, phone, email, current_balance, total_debt) VALUES
  ('550e8400-e29b-41d4-a716-446655440011', 'Dr. Mehmet Özkan', '550e8400-e29b-41d4-a716-446655440001', '0532 111 2233', 'mehmet.ozkan@aklinigi.com', 5000, 8000),
  ('550e8400-e29b-41d4-a716-446655440012', 'Dr. Ayşe Demir', '550e8400-e29b-41d4-a716-446655440001', '0532 111 2244', 'ayse.demir@aklinigi.com', 10000, 17000),
  ('550e8400-e29b-41d4-a716-446655440013', 'Dr. Ali Çelik', '550e8400-e29b-41d4-a716-446655440002', '0532 111 2255', 'ali.celik@bklinigi.com', 8500, 12000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO prosthesis_types (id, name, base_price, model_price, category) VALUES
  ('550e8400-e29b-41d4-a716-446655440021', 'Zirkonyum Kuron', 800, 150, 'Kuron'),
  ('550e8400-e29b-41d4-a716-446655440022', 'E-Max Kuron', 600, 150, 'Kuron'),
  ('550e8400-e29b-41d4-a716-446655440023', 'Metal Destekli Porselen', 400, 150, 'Kuron'),
  ('550e8400-e29b-41d4-a716-446655440024', 'Tam Protez', 1200, 200, 'Protez'),
  ('550e8400-e29b-41d4-a716-446655440025', 'Parsiyel Protez', 800, 180, 'Protez'),
  ('550e8400-e29b-41d4-a716-446655440026', 'İmplant Üstü Kuron', 1000, 160, 'İmplant')
ON CONFLICT (id) DO NOTHING;

INSERT INTO technicians (id, name, username, password, monthly_quota, completed_jobs, salary, is_active, phone, email) VALUES
  ('550e8400-e29b-41d4-a716-446655440031', 'Ahmet Yılmaz', 'teknisyen1', '123456', 100, 45, 25000, true, '0532 333 4455', 'ahmet@dentallab.com'),
  ('550e8400-e29b-41d4-a716-446655440032', 'Elif Kaya', 'teknisyen2', '123456', 80, 38, 22000, true, '0532 333 4466', 'elif@dentallab.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO expenses (id, date, category, description, amount, supplier, invoice_number) VALUES
  ('550e8400-e29b-41d4-a716-446655440051', '2024-01-15', 'Malzeme', 'Zirkonyum Blok', 2500, 'Dental Malzeme A.Ş.', 'FM-2024-001'),
  ('550e8400-e29b-41d4-a716-446655440052', '2024-01-20', 'Ekipman', 'Fırın Bakımı', 800, 'Teknik Servis Ltd.', 'TS-2024-005')
ON CONFLICT (id) DO NOTHING;

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
CREATE INDEX IF NOT EXISTS idx_payments_doctor_id ON payments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prosthesis_types_updated_at BEFORE UPDATE ON prosthesis_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();