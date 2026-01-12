-- Make payment-slips bucket private to protect sensitive financial documents
UPDATE storage.buckets SET public = false WHERE id = 'payment-slips';