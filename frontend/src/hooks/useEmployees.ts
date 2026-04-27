import { useState, useEffect } from 'react';
import { Profile, AppRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ProfileUpdateSchema, validateInput } from '@/utils/validation';
import { employeeService } from '@/api/employeeService';

export interface Employee extends Profile {
  role: AppRole;
  leads_count: number;
  dob?: string;
}

export const useEmployees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployees = async () => {
    if (!user || user.role !== 'admin') return;

    try {
      const data = await employeeService.getEmployees();
      setEmployees(data.map((e: any) => ({
        ...e,
        id: e._id,
        user_id: e._id,
        created_at: e.createdAt || e.created_at,
        updated_at: e.updatedAt || e.updated_at,
        leads_count: e.leads_count || 0
      })));
    } catch (error: any) {
      toast.error('Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchEmployees();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const updateEmployee = async (userId: string, updates: Partial<Profile>) => {
    const validation = validateInput(ProfileUpdateSchema, updates);
    if (!validation.success) {
      toast.error(validation.error);
      return false;
    }

    try {
      const updatedData = await employeeService.updateEmployee(userId, validation.data);
      setEmployees((prev) =>
        prev.map((e) => (e.id === userId ? { ...e, ...updatedData } : e))
      );
      toast.success('Employee updated successfully');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update employee');
      return false;
    }
  };

  const updateEmployeeRole = async (userId: string, role: AppRole) => {
    try {
      await employeeService.updateEmployee(userId, { role });
      setEmployees((prev) =>
        prev.map((e) => (e.id === userId ? { ...e, role } : e))
      );
      toast.success('Role updated successfully');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update role');
      return false;
    }
  };

  const toggleEmployeeStatus = async (userId: string, isActive: boolean) => {
    return updateEmployee(userId, { is_active: isActive });
  };

  const deleteEmployee = async (userId: string) => {
    try {
      await employeeService.deleteEmployee(userId);
      setEmployees((prev) => prev.filter((e) => e.id !== userId));
      toast.success('Employee deleted successfully');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete employee');
      return false;
    }
  };

  return {
    employees,
    isLoading,
    updateEmployee,
    updateEmployeeRole,
    toggleEmployeeStatus,
    deleteEmployee,
    refetchEmployees: fetchEmployees,
  };
};
