-- Create enum for departments
CREATE TYPE public.department AS ENUM ('BDA', 'HR', 'Tech', 'Ops', 'Marketing', 'Finance', 'Other');

-- Create employee_reports table
CREATE TABLE public.employee_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  department department NOT NULL,
  morning_description TEXT,
  afternoon_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_date)
);

-- Enable RLS
ALTER TABLE public.employee_reports ENABLE ROW LEVEL SECURITY;

-- Employees can view their own reports
CREATE POLICY "Employees can view their own reports"
ON public.employee_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Employees can insert their own reports
CREATE POLICY "Employees can insert their own reports"
ON public.employee_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Employees can update their own reports
CREATE POLICY "Employees can update their own reports"
ON public.employee_reports
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
ON public.employee_reports
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_employee_reports_updated_at
BEFORE UPDATE ON public.employee_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();