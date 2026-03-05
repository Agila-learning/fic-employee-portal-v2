import { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadsTable from '@/components/leads/LeadsTable';
import { useLeads } from '@/hooks/useLeads';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Upload, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminLeads = () => {
  const { leads, refetchLeads, bulkUpload, isLoading } = useLeads();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const paymentStageFilter = searchParams.get('payment_stage') || undefined;
  const statusFilter = searchParams.get('status') || undefined;

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    try {
      setIsUploading(true);
      const success = await bulkUpload(file);
      if (success) {
        toast.success('Leads uploaded successfully');
        refetchLeads();
      }
    } catch (error) {
      toast.error('Bulk upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const headers = ['name,email,phone,course,interested_domain,status,source,notes'];
    const csvContent = headers.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Leads</h1>
            <p className="text-muted-foreground">View and manage all candidate leads across the team</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Template
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleBulkUpload}
              accept=".csv"
              className="hidden"
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isLoading}
              className="gap-2"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isUploading ? 'Uploading...' : 'Bulk Upload'}
            </Button>
          </div>
        </div>
        <LeadsTable leads={leads} showAssignee onRefresh={refetchLeads} defaultPaymentStageFilter={paymentStageFilter} defaultStatusFilter={statusFilter} />
      </div>
    </DashboardLayout>
  );
};

export default AdminLeads;