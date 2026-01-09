-- Make the payment-slips bucket public so uploaded files can be viewed
UPDATE storage.buckets SET public = true WHERE id = 'payment-slips';