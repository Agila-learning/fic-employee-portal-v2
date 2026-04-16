import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { resignationService } from '@/api/resignationService';
import { Resignation } from '@/types';
import ApplyResignationForm from './ApplyResignationForm';
import ResignationStatusView from './ResignationStatusView';
import { Loader2 } from 'lucide-react';

const EmployeeResignation = () => {
  const [resignation, setResignation] = useState<Resignation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyResignation();
  }, []);

  const fetchMyResignation = async () => {
    try {
      const data = await resignationService.getMyResignation();
      setResignation(data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching resignation:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (newResignation: Resignation) => {
    setResignation(newResignation);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-24 space-y-8">
        {!resignation || resignation.status === 'Rejected' ? (
          <ApplyResignationForm onSuccess={handleSuccess} previousResignation={resignation} />
        ) : (
          <ResignationStatusView resignation={resignation} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeResignation;
