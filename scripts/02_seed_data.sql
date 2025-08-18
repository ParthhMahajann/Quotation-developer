-- Seed data for RERA Quotation System

-- Insert developer types
INSERT INTO public.developer_types (name, multiplier, description) VALUES
('Category 1', 1.0, 'Standard developer category with base pricing'),
('Category 2', 1.2, 'Premium developer category with 20% markup'),
('Category 3', 0.8, 'Volume developer category with 20% discount'),
('Agent Registration', 1.0, 'Special category for agent registrations')
ON CONFLICT (name) DO NOTHING;

-- Insert regions
INSERT INTO public.regions (name, multiplier, description) VALUES
('Mumbai City', 1.5, 'Mumbai City area with 50% premium'),
('Mumbai Suburban', 1.3, 'Mumbai Suburban area with 30% premium'),
('Thane', 1.2, 'Thane region with 20% premium'),
('Palghar', 1.1, 'Palghar region with 10% premium'),
('KDMC', 1.2, 'KDMC region with 20% premium'),
('Navi Mumbai', 1.15, 'Navi Mumbai region with 15% premium'),
('Raigad', 1.1, 'Raigad region with 10% premium'),
('Pune 1', 1.1, 'Pune subdivision 1 with 10% premium'),
('Pune 2', 1.1, 'Pune subdivision 2 with 10% premium'),
('Pune 3', 1.1, 'Pune subdivision 3 with 10% premium'),
('Pune 4', 1.1, 'Pune subdivision 4 with 10% premium'),
('ROM (Rest of Maharashtra)', 0.9, 'Rest of Maharashtra with 10% discount')
ON CONFLICT (name) DO NOTHING;

-- Insert plot area ranges
INSERT INTO public.plot_area_ranges (min_area, max_area, range_label, multiplier) VALUES
(0, 500, '0-500 sq ft', 0.8),
(501, 1000, '501-1000 sq ft', 1.0),
(1001, 2000, '1001-2000 sq ft', 1.1),
(2001, 4000, '2001-4000 sq ft', 1.25),
(4001, 6500, '4001-6500 sq ft', 1.4),
(6501, NULL, '6500+ sq ft', 1.6)
ON CONFLICT (min_area, max_area) DO NOTHING;

-- Insert service categories
INSERT INTO public.service_categories (name, complexity_factor, description) VALUES
('Registration Services', 1.0, 'Project registration and related services'),
('Legal Services', 1.3, 'Legal documentation and compliance services'),
('Project Time Extension', 1.5, 'Project timeline extension services'),
('Project Correction', 1.2, 'Project modification and correction services'),
('Project Closure', 1.1, 'Project closure and completion services'),
('Removal of Abeyance', 1.2, 'Services to remove project abeyance status'),
('Deregistration', 1.1, 'Project deregistration services'),
('Change of Promoter (Section 15)', 1.4, 'Promoter change management services'),
('Profile Migration', 1.0, 'Profile migration and update services'),
('Compliance Services', 0.9, 'General compliance and regulatory services')
ON CONFLICT (name) DO NOTHING;

-- Insert services
INSERT INTO public.services (category_id, name, base_price, is_mandatory, description) VALUES
-- Registration Services
((SELECT id FROM public.service_categories WHERE name = 'Registration Services'), 'Project Registration', 50000.00, true, 'Mandatory project registration service'),

-- Legal Services
((SELECT id FROM public.service_categories WHERE name = 'Legal Services'), 'Legal Document Drafting and Vetting', 25000.00, false, 'Legal document preparation and review'),
((SELECT id FROM public.service_categories WHERE name = 'Legal Services'), 'Title Report Generation (Format A)', 15000.00, false, 'Title report in Format A'),
((SELECT id FROM public.service_categories WHERE name = 'Legal Services'), 'Title Certificate Processing', 20000.00, false, 'Title certificate processing service'),
((SELECT id FROM public.service_categories WHERE name = 'Legal Services'), 'Form 1 Processing', 8000.00, false, 'Form 1 processing service'),
((SELECT id FROM public.service_categories WHERE name = 'Legal Services'), 'Form 2 Processing', 8000.00, false, 'Form 2 processing service'),
((SELECT id FROM public.service_categories WHERE name = 'Legal Services'), 'Form 3 Processing', 8000.00, false, 'Form 3 processing service'),

-- Project Time Extension
((SELECT id FROM public.service_categories WHERE name = 'Project Time Extension'), 'Section 6 Compliance', 30000.00, true, 'Mandatory Section 6 compliance for extensions'),
((SELECT id FROM public.service_categories WHERE name = 'Project Time Extension'), 'Section 7.3 Compliance', 25000.00, true, 'Mandatory Section 7.3 compliance for extensions'),
((SELECT id FROM public.service_categories WHERE name = 'Project Time Extension'), 'Post Facto Processing', 35000.00, true, 'Mandatory post facto processing'),
((SELECT id FROM public.service_categories WHERE name = 'Project Time Extension'), 'Order 40 Handling', 20000.00, true, 'Mandatory Order 40 handling'),

-- Project Correction
((SELECT id FROM public.service_categories WHERE name = 'Project Correction'), 'FSI/Plan Changes', 40000.00, false, 'FSI and plan modification services'),
((SELECT id FROM public.service_categories WHERE name = 'Project Correction'), 'Bank Account Updates', 15000.00, false, 'Bank account information updates'),

-- Project Closure
((SELECT id FROM public.service_categories WHERE name = 'Project Closure'), 'Project Closure Procedures', 35000.00, false, 'Complete project closure processing'),

-- Removal of Abeyance
((SELECT id FROM public.service_categories WHERE name = 'Removal of Abeyance'), 'QPR Submission', 18000.00, false, 'Quarterly Progress Report submission'),
((SELECT id FROM public.service_categories WHERE name = 'Removal of Abeyance'), 'Lapsed Project Revival', 25000.00, false, 'Revival of lapsed project status'),

-- Deregistration
((SELECT id FROM public.service_categories WHERE name = 'Deregistration'), 'Deregistration Process', 30000.00, false, 'Complete deregistration processing'),

-- Change of Promoter
((SELECT id FROM public.service_categories WHERE name = 'Change of Promoter (Section 15)'), 'Promoter Change Management', 45000.00, false, 'Complete promoter change process'),

-- Profile Migration
((SELECT id FROM public.service_categories WHERE name = 'Profile Migration'), 'Profile Migration Services', 12000.00, false, 'Profile migration and updates'),
((SELECT id FROM public.service_categories WHERE name = 'Profile Migration'), 'Form 5 Processing', 8000.00, false, 'Form 5 processing service'),

-- Compliance Services
((SELECT id FROM public.service_categories WHERE name = 'Compliance Services'), 'Liaison Services', 15000.00, false, 'Government liaison services'),
((SELECT id FROM public.service_categories WHERE name = 'Compliance Services'), 'SRO Membership Management', 10000.00, false, 'SRO membership processing')
ON CONFLICT DO NOTHING;

-- Insert service dependencies (Registration requires certain legal services)
INSERT INTO public.service_dependencies (service_id, required_service_id) VALUES
((SELECT id FROM public.services WHERE name = 'Project Registration'), 
 (SELECT id FROM public.services WHERE name = 'Legal Document Drafting and Vetting'))
ON CONFLICT DO NOTHING;

-- Create function to auto-generate quotation numbers
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    quotation_number TEXT;
BEGIN
    -- Get the next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(quotation_number FROM 'QUO-(\d+)-') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.quotations
    WHERE quotation_number ~ '^QUO-\d+-\d{4}$';
    
    -- Generate quotation number: QUO-{sequence}-{year}
    quotation_number := 'QUO-' || LPAD(next_number::TEXT, 4, '0') || '-' || EXTRACT(YEAR FROM NOW())::TEXT;
    
    RETURN quotation_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate quotation number
CREATE OR REPLACE FUNCTION set_quotation_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
        NEW.quotation_number := generate_quotation_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_quotation_number
    BEFORE INSERT ON public.quotations
    FOR EACH ROW
    EXECUTE FUNCTION set_quotation_number();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_quotations_updated_at
    BEFORE UPDATE ON public.quotations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
