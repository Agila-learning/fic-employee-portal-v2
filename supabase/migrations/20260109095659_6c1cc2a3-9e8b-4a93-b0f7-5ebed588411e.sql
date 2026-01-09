-- Create payment_stage enum
CREATE TYPE public.payment_stage AS ENUM ('registration_done', 'initial_payment_done', 'full_payment_done');

-- Add payment_stage column to leads table
ALTER TABLE public.leads ADD COLUMN payment_stage public.payment_stage;