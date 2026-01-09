-- Add leave_reason column to attendance table
ALTER TABLE public.attendance ADD COLUMN leave_reason text;

-- Update tasks table to track if email notification was sent
ALTER TABLE public.tasks ADD COLUMN email_sent boolean DEFAULT false;