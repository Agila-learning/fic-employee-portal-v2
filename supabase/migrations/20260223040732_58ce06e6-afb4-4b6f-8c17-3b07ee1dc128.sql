
-- Create payslips table
CREATE TABLE public.payslips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  employee_id TEXT,
  department TEXT,
  designation TEXT,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- Earnings
  basic_salary NUMERIC NOT NULL DEFAULT 0,
  hra NUMERIC NOT NULL DEFAULT 0,
  conveyance_allowance NUMERIC NOT NULL DEFAULT 0,
  medical_allowance NUMERIC NOT NULL DEFAULT 0,
  special_allowance NUMERIC NOT NULL DEFAULT 0,
  other_earnings NUMERIC NOT NULL DEFAULT 0,
  
  -- Deductions
  pf_employee NUMERIC NOT NULL DEFAULT 0,
  pf_employer NUMERIC NOT NULL DEFAULT 0,
  esi_employee NUMERIC NOT NULL DEFAULT 0,
  esi_employer NUMERIC NOT NULL DEFAULT 0,
  professional_tax NUMERIC NOT NULL DEFAULT 0,
  tds NUMERIC NOT NULL DEFAULT 0,
  other_deductions NUMERIC NOT NULL DEFAULT 0,
  
  -- Totals
  gross_salary NUMERIC NOT NULL DEFAULT 0,
  total_deductions NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  ctc NUMERIC NOT NULL DEFAULT 0,
  
  -- Metadata
  bank_name TEXT,
  bank_account_number TEXT,
  pan_number TEXT,
  uan_number TEXT,
  total_working_days INTEGER DEFAULT 30,
  days_worked INTEGER DEFAULT 30,
  leave_days INTEGER DEFAULT 0,
  
  generated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, month, year)
);

-- Enable RLS
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage all payslips"
ON public.payslips FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all payslips"
ON public.payslips FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Employee policies
CREATE POLICY "Employees can view their own payslips"
ON public.payslips FOR SELECT
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_payslips_updated_at
BEFORE UPDATE ON public.payslips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
