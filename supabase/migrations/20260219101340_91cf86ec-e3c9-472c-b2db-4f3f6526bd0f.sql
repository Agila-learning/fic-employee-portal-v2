
-- Add receipt_url and approval_status to expenses table
ALTER TABLE public.expenses ADD COLUMN receipt_url text;
ALTER TABLE public.expenses ADD COLUMN approval_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.expenses ADD COLUMN approved_by uuid;
ALTER TABLE public.expenses ADD COLUMN approved_at timestamp with time zone;

-- Create storage bucket for expense receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('expense-receipts', 'expense-receipts', false);

-- Storage RLS: employees can upload their own receipts
CREATE POLICY "Users can upload their own expense receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage RLS: employees can view their own receipts
CREATE POLICY "Users can view their own expense receipts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'expense-receipts' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role)));

-- Storage RLS: employees can delete their own receipts
CREATE POLICY "Users can delete their own expense receipts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage RLS: admins can view all receipts
CREATE POLICY "Admins can manage all expense receipts"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'expense-receipts' AND has_role(auth.uid(), 'admin'::app_role));
