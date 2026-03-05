import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { operationService } from '@/api/operationService';

export interface LeaveRequest {
  id: string;
  _id?: string;
  user_id: string;
  leave_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee_name?: string;
}

export const useLeaveRequests = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaveRequests = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = user.role === 'admin'
        ? await operationService.getAllLeaveRequests()
        : await operationService.getMyLeaveRequests();
      setLeaveRequests(data.map((r: any) => ({
        ...r,
        id: r._id,
        created_at: r.createdAt || r.created_at,
        updated_at: r.updatedAt || r.updated_at,
        employee_name: r.user_id?.name || 'Unknown'
      })));
    } catch (err: any) {
      console.error('Error fetching leave requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const createLeaveRequest = async (leaveDate: string, reason: string) => {
    if (!user) return false;
    try {
      await operationService.createLeaveRequest({
        leave_date: leaveDate,
        reason: reason.trim(),
      });
      toast.success('Leave request submitted successfully!');
      await fetchLeaveRequests();
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
      return false;
    }
  };

  const updateLeaveStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!user) return false;
    try {
      await operationService.updateLeaveStatus(id, status);
      toast.success(`Leave request ${status}!`);
      await fetchLeaveRequests();
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${status} leave request`);
      return false;
    }
  };

  const deleteLeaveRequest = async (id: string) => {
    if (!user) return false;
    try {
      await operationService.deleteLeaveRequest(id);
      await fetchLeaveRequests();
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete leave request');
      return false;
    }
  };

  return { leaveRequests, isLoading, createLeaveRequest, updateLeaveStatus, deleteLeaveRequest, refetch: fetchLeaveRequests };
};
