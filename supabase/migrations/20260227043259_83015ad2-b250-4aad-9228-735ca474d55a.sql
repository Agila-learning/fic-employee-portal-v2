
CREATE TABLE public.success_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_name TEXT NOT NULL,
  package TEXT NOT NULL,
  location TEXT NOT NULL,
  domain TEXT NOT NULL,
  motivation_words TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage success stories"
  ON public.success_stories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can view
CREATE POLICY "Authenticated users can view success stories"
  ON public.success_stories FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.success_stories;
