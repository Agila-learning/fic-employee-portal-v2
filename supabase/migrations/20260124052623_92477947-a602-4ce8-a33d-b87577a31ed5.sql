-- Add half_day column to attendance table for tracking half-day attendance
ALTER TABLE public.attendance 
ADD COLUMN half_day boolean DEFAULT false;

-- Add location tracking columns for GPS verification
ALTER TABLE public.attendance 
ADD COLUMN latitude decimal(10, 8),
ADD COLUMN longitude decimal(11, 8),
ADD COLUMN location_verified boolean DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_attendance_half_day ON public.attendance(half_day) WHERE half_day = true;