-- Create quotation management tables for RERA system
-- Note: Using Supabase's built-in auth.users table instead of custom users table

-- Enable Row Level Security


-- Developer Types lookup table
CREATE TABLE IF NOT EXISTS developer_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regions lookup table
CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services lookup table
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  complexity_factor DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  is_mandatory BOOLEAN DEFAULT FALSE,
  parent_service_id INTEGER REFERENCES services(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plot area ranges lookup table
CREATE TABLE IF NOT EXISTS plot_area_ranges (
  id SERIAL PRIMARY KEY,
  min_area INTEGER NOT NULL,
  max_area INTEGER,
  range_name VARCHAR(50) NOT NULL,
  multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotations main table
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Project details
  developer_type_id INTEGER NOT NULL REFERENCES developer_types(id),
  region_id INTEGER NOT NULL REFERENCES regions(id),
  project_name VARCHAR(200),
  project_location TEXT,
  plot_area INTEGER,
  plot_area_range_id INTEGER REFERENCES plot_area_ranges(id),
  
  -- Developer details
  developer_name VARCHAR(200) NOT NULL,
  rera_number VARCHAR(100),
  
  -- Quotation details
  validity_days INTEGER DEFAULT 30,
  payment_schedule VARCHAR(20) DEFAULT '50%',
  
  -- Pricing
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  
  -- Status and approval
  status VARCHAR(50) DEFAULT 'draft',
  approval_status VARCHAR(50) DEFAULT 'pending',
  approval_level_required INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotation services junction table
CREATE TABLE IF NOT EXISTS quotation_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id),
  original_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL,
  discount_applied DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approval workflow table
CREATE TABLE IF NOT EXISTS quotation_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  approver_user_id UUID REFERENCES auth.users(id),
  approval_level INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at);
CREATE INDEX IF NOT EXISTS idx_quotation_services_quotation_id ON quotation_services(quotation_id);

-- Enable Row Level Security
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own quotations" ON quotations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotations" ON quotations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotations" ON quotations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their quotation services" ON quotation_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE quotations.id = quotation_services.quotation_id 
      AND quotations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their quotation services" ON quotation_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE quotations.id = quotation_services.quotation_id 
      AND quotations.user_id = auth.uid()
    )
  );
