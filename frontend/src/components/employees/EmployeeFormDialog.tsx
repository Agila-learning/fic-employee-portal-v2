import { useState, useEffect } from 'react';
import { Employee } from '@/hooks/useEmployees';
import { employeeService } from '@/api/employeeService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
}

const EmployeeFormDialog = ({ open, onOpenChange, employee, onSuccess }: EmployeeFormDialogProps & { onSuccess?: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', email: '', employee_id: '', is_active: true, 
    role: 'employee' as 'admin' | 'employee' | 'md' | 'sub-admin' | 'hr_manager',
    base_salary: '', incentive_per_success: '' 
  });

  useEffect(() => {
    if (employee && open) {
      setFormData({
        name: employee.name,
        email: employee.email,
        employee_id: employee.employee_id || '',
        is_active: employee.is_active ?? true,
        role: employee.role as any || 'employee',
        base_salary: (employee as any).base_salary || '',
        incentive_per_success: (employee as any).incentive_per_success || ''
      });
    }
  }, [employee, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await employeeService.updateEmployee(employee.id || (employee as any)._id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        employee_id: formData.employee_id || null,
        is_active: formData.is_active,
        base_salary: formData.base_salary ? parseFloat(formData.base_salary) : null,
        incentive_per_success: formData.incentive_per_success ? parseFloat(formData.incentive_per_success) : null
      });

      toast.success('Employee updated successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast.error(error.response?.data?.message || 'Failed to update employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-xl font-semibold">Edit Employee</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2"><Label>Full Name *</Label><Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Enter full name" /></div>
          <div className="space-y-2"><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="email@company.com" /></div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Role *
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value: any) => setFormData(p => ({ ...p, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="hr_manager">HR Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="sub-admin">Sub-Admin</SelectItem>
                <SelectItem value="md">Managing Director (MD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2"><Label>Employee ID</Label><Input value={formData.employee_id} onChange={(e) => setFormData(p => ({ ...p, employee_id: e.target.value }))} placeholder="EMP001" /></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Base Monthly Salary (₹)</Label>
              <Input type="number" value={formData.base_salary} onChange={(e) => setFormData(p => ({ ...p, base_salary: e.target.value }))} placeholder="25000" />
            </div>
            <div className="space-y-2">
              <Label>Incentive per Success Item (₹)</Label>
              <Input type="number" value={formData.incentive_per_success} onChange={(e) => setFormData(p => ({ ...p, incentive_per_success: e.target.value }))} placeholder="100" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div><Label className="font-medium">Account Status</Label><p className="text-sm text-muted-foreground">{formData.is_active ? 'Employee can login' : 'Employee cannot login'}</p></div>
            <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="gradient-primary" disabled={isSubmitting}>{isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeFormDialog;
