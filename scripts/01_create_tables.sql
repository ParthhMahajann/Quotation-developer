-- RERA Quotation Management System Database Schema

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'manager', 'senior_manager', 'director', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Developer types lookup
CREATE TABLE IF NOT EXISTS public.developer_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  multiplier DECIMAL(3,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regions lookup
CREATE TABLE IF NOT EXISTS public.regions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  multiplier DECIMAL(3,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plot area ranges lookup
CREATE TABLE IF NOT EXISTS public.plot_area_ranges (
  id SERIAL PRIMARY KEY,
  min_area INTEGER NOT NULL,
  max_area INTEGER,
  range_label TEXT NOT NULL,
  multiplier DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service categories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  complexity_factor DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services
CREATE TABLE IF NOT EXISTS public.services (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES public.service_categories(id),
  name TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  is_mandatory BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service dependencies (which services require other services)
CREATE TABLE IF NOT EXISTS public.service_dependencies (
  id SERIAL PRIMARY KEY,
  service_id INTEGER REFERENCES public.services(id),
  required_service_id INTEGER REFERENCES public.services(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_id, required_service_id)
);

-- Quotations main table
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.users(id),
  
  -- Project details
  developer_type_id INTEGER REFERENCES public.developer_types(id),
  region_id INTEGER REFERENCES public.regions(id),
  plot_area INTEGER,
  plot_area_range_id INTEGER REFERENCES public.plot_area_ranges(id),
  
  -- Developer information
  developer_name TEXT NOT NULL,
  project_name TEXT,
  project_location TEXT,
  rera_number TEXT,
  
  -- Quotation details
  validity_days INTEGER DEFAULT 30,
  payment_schedule TEXT CHECK (payment_schedule IN ('50%', '70%', '100%')),
  
  -- Pricing
  subtotal DECIMAL(12,2) NOT NULL,
  total_discount_percentage DECIMAL(5,2) DEFAULT 0,
  total_discount_amount DECIMAL(12,2) DEFAULT 0,
  final_total DECIMAL(12,2) NOT NULL,
  
  -- Status and workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'sent', 'expired')),
  approval_required BOOLEAN DEFAULT FALSE,
  approval_level TEXT CHECK (approval_level IN ('manager', 'senior_manager', 'director')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Quotation services (selected services for each quotation)
CREATE TABLE IF NOT EXISTS public.quotation_services (
  id SERIAL PRIMARY KEY,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES public.services(id),
  
  -- Pricing details
  original_price DECIMAL(10,2) NOT NULL,
  modified_price DECIMAL(10,2),
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_reason TEXT,
  final_price DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotation approvals workflow
CREATE TABLE IF NOT EXISTS public.quotation_approvals (
  id SERIAL PRIMARY KEY,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  
  -- Approval details
  original_amount DECIMAL(12,2) NOT NULL,
  discounted_amount DECIMAL(12,2) NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  approval_level_required TEXT NOT NULL CHECK (approval_level_required IN ('manager', 'senior_manager', 'director')),
  
  -- Approver information
  approver_user_id UUID REFERENCES public.users(id),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approval_date TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trail for quotation changes
CREATE TABLE IF NOT EXISTS public.quotation_audit_log (
  id SERIAL PRIMARY KEY,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON public.quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON public.quotations(created_at);
CREATE INDEX IF NOT EXISTS idx_quotation_services_quotation_id ON public.quotation_services(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_approvals_quotation_id ON public.quotation_approvals(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_audit_log_quotation_id ON public.quotation_audit_log(quotation_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Quotations policies
CREATE POLICY "Users can view own quotations" ON public.quotations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create quotations" ON public.quotations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotations" ON public.quotations
  FOR UPDATE USING (auth.uid() = user_id);

-- Quotation services policies
CREATE POLICY "Users can view own quotation services" ON public.quotation_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotations 
      WHERE quotations.id = quotation_services.quotation_id 
      AND quotations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own quotation services" ON public.quotation_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quotations 
      WHERE quotations.id = quotation_services.quotation_id 
      AND quotations.user_id = auth.uid()
    )
  );

-- Approval policies (managers and above can see pending approvals)
CREATE POLICY "Managers can view pending approvals" ON public.quotation_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('manager', 'senior_manager', 'director', 'admin')
    )
  );

-- Audit log policies
CREATE POLICY "Users can view own quotation audit logs" ON public.quotation_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotations 
      WHERE quotations.id = quotation_audit_log.quotation_id 
      AND quotations.user_id = auth.uid()
    )
  );
