import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { salaryService } from '@/api/salaryService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Landmark, Plus, Search, Calendar, MapPin, Building2, History, Trash2, Edit, ShieldCheck, Ban } from 'lucide-react';
import { format } from 'date-fns';

const AdminSalaryDetails = () => {
  const { user } = useAuth();
  const { employees } = useEmployees();
  const [salaryDetails, setSalaryDetails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  
  // States for Manage Credentials Modal
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [credentialForm, setCredentialForm] = useState({
    ifscCode: '',
    bankName: '',
    accountNumber: '',
    location: '',
    department: '',
    joiningDate: '',
    totalSalary: '',
  });

  // States for Monthly Salary Modal
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [manageMonthlyUser, setManageMonthlyUser] = useState<any>(null);
  const [monthlyForm, setMonthlyForm] = useState({
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    amount: '',
    lopDays: '0',
    lopAmount: '0',
    status: 'Received',
    remarks: '',
  });

  const activeEmployees = employees.filter(e => e.is_active !== false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await salaryService.getAllSalaryDetails();
      setSalaryDetails(data || []);
    } catch (error) {
      toast.error('Failed to fetch salary details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please select an employee');
      return;
    }

    try {
      await salaryService.upsertSalaryDetail({
        userId: selectedUser,
        ...credentialForm,
      });
      toast.success('Salary credentials updated successfully');
      setIsCredentialModalOpen(false);
      resetCredentialForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update credentials');
    }
  };

  const handleMonthlySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageMonthlyUser) return;

    try {
      await salaryService.addMonthlySalary({
        userId: manageMonthlyUser.user._id || manageMonthlyUser.user,
        ...monthlyForm,
      });
      toast.success('Monthly salary record added');
      setIsMonthlyModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add record');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this salary detail record?')) return;
    try {
      await salaryService.deleteSalaryDetail(id);
      toast.success('Record deleted');
      fetchData();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete record. Please check console for details.');
    }
  };

  const handleMonthlyDelete = async (month: number, year: number) => {
    if (!manageMonthlyUser) return;
    if (!window.confirm(`Are you sure you want to delete the salary record for ${format(new Date(year, month-1, 1), 'MMMM yyyy')}?`)) return;
    
    try {
      await salaryService.deleteMonthlySalary(
        manageMonthlyUser.user._id || manageMonthlyUser.user,
        month.toString(),
        year.toString()
      );
      toast.success('Monthly record deleted');
      
      // Refresh local state for the modal
      const updatedData = await salaryService.getAllSalaryDetails();
      setSalaryDetails(updatedData || []);
      const updatedUser = updatedData.find((d: any) => (d._id === manageMonthlyUser._id));
      setManageMonthlyUser(updatedUser);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete monthly record');
    }
  };

  const resetCredentialForm = () => {
    setSelectedUser('');
    setCredentialForm({
      ifscCode: '',
      bankName: '',
      accountNumber: '',
      location: '',
      department: '',
      joiningDate: '',
      totalSalary: '',
    });
  };

  const openEditModal = (detail: any) => {
    setSelectedUser(detail.user._id || detail.user);
    setCredentialForm({
      ifscCode: detail.ifscCode || '',
      bankName: detail.bankName || '',
      accountNumber: detail.accountNumber || '',
      location: detail.location || '',
      department: detail.department || '',
      joiningDate: detail.joiningDate ? detail.joiningDate.split('T')[0] : '',
      totalSalary: detail.totalSalary?.toString() || '',
    });
    setIsCredentialModalOpen(true);
  };

  const filteredDetails = salaryDetails.filter(d => 
    d.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.bankName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Salary Details</h1>
            <p className="text-sm text-muted-foreground">Manage employee bank credentials and track monthly payments</p>
          </div>
          <Dialog open={isCredentialModalOpen} onOpenChange={setIsCredentialModalOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary shadow-lg shadow-primary/20" onClick={resetCredentialForm}>
                <Plus className="mr-2 h-4 w-4" /> Add Credentials
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Manage Salary Credentials</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCredentialSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Employee</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger><SelectValue placeholder="Choose employee" /></SelectTrigger>
                    <SelectContent>
                      {activeEmployees.map(emp => (
                        <SelectItem key={(emp as any)._id || (emp as any).user_id} value={(emp as any)._id || (emp as any).user_id}>
                          {emp.name} ({emp.employee_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input value={credentialForm.bankName} onChange={e => setCredentialForm({...credentialForm, bankName: e.target.value})} placeholder="e.g. SBI, HDFC" />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input value={credentialForm.accountNumber} onChange={e => setCredentialForm({...credentialForm, accountNumber: e.target.value})} placeholder="Account No" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input value={credentialForm.ifscCode} onChange={e => setCredentialForm({...credentialForm, ifscCode: e.target.value})} placeholder="SBIN000..." />
                </div>
                <div className="space-y-2">
                  <Label>Location / Branch</Label>
                  <Input value={credentialForm.location} onChange={e => setCredentialForm({...credentialForm, location: e.target.value})} placeholder="Branch location" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input value={credentialForm.department} onChange={e => setCredentialForm({...credentialForm, department: e.target.value})} placeholder="e.g. Sales" />
                  </div>
                  <div className="space-y-2">
                    <Label>Joining Date</Label>
                    <Input type="date" value={credentialForm.joiningDate} onChange={e => setCredentialForm({...credentialForm, joiningDate: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Total Salary (Base/CTC)</Label>
                  <Input type="number" value={credentialForm.totalSalary} onChange={e => setCredentialForm({...credentialForm, totalSalary: e.target.value})} placeholder="₹" />
                </div>
                <Button type="submit" className="w-full gradient-primary">Save Credentials</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search name, ID or bank..." 
                  className="pl-10 bg-background/50 border-border/50"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 items-center">
                <div className="flex gap-2">
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-[130px] h-9 bg-background/50"><SelectValue placeholder="Month" /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                        <SelectItem key={m} value={m.toString()}>{format(new Date(2022, m-1, 1), 'MMMM')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input 
                    type="number" 
                    className="w-[100px] h-9 bg-background/50" 
                    value={filterYear} 
                    onChange={e => setFilterYear(e.target.value)} 
                    placeholder="Year"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Employee</TableHead>
                    <TableHead>Bank / IFSC</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Total Salary</TableHead>
                    <TableHead>Status ({format(new Date(2022, parseInt(filterMonth)-1, 1), 'MMM')} {filterYear})</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDetails.map(detail => {
                    const monthlyRecord = detail.monthlySalaries?.find((s: any) => 
                      s.month === parseInt(filterMonth) && s.year === parseInt(filterYear)
                    );
                    
                    return (
                      <TableRow key={detail._id} className="border-border/50 group">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{detail.employeeName}</span>
                            <span className="text-xs text-muted-foreground">{detail.employeeId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{detail.bankName}</span>
                            <span className="text-xs text-muted-foreground">{detail.accountNumber || 'N/A'}</span>
                            <span className="text-[10px] font-mono text-muted-foreground/60">{detail.ifscCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {detail.joiningDate ? format(new Date(detail.joiningDate), 'dd-MM-yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="font-bold text-slate-700">₹{detail.totalSalary?.toLocaleString()}</TableCell>
                        <TableCell>
                          {monthlyRecord ? (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 py-0.5 text-[10px] flex gap-1 items-center w-max">
                              <ShieldCheck className="w-3 h-3" /> Received
                            </Badge>
                          ) : (
                            <Badge className="bg-red-50 text-red-600 border-none px-2 py-0.5 text-[10px] flex gap-1 items-center w-max">
                              <Ban className="w-3 h-3" /> Not Received
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => { setManageMonthlyUser(detail); setIsMonthlyModalOpen(true); }}>
                              <History className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-500" onClick={() => openEditModal(detail)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(detail._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Monthly Salary Modal */}
      <Dialog open={isMonthlyModalOpen} onOpenChange={setIsMonthlyModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Salary History: {manageMonthlyUser?.employeeName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-border/50">
              <h4 className="font-bold text-sm mb-3">Add Monthly Payment</h4>
              <form onSubmit={handleMonthlySubmit} className="grid grid-cols-2 lg:grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase">Month</Label>
                  <Select value={monthlyForm.month} onValueChange={m => setMonthlyForm({...monthlyForm, month: m})}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <SelectItem key={m} value={m.toString()}>{format(new Date(2022, m-1, 1), 'MMMM')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase">Year</Label>
                  <Input type="number" className="h-8" value={monthlyForm.year} onChange={e => setMonthlyForm({...monthlyForm, year: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase">Paid Amount (₹)</Label>
                  <Input type="number" className="h-8" value={monthlyForm.amount} onChange={e => setMonthlyForm({...monthlyForm, amount: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase">LOP Days</Label>
                  <Input type="number" className="h-8" value={monthlyForm.lopDays} onChange={e => setMonthlyForm({...monthlyForm, lopDays: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase">LOP Amount (₹)</Label>
                  <Input type="number" className="h-8" value={monthlyForm.lopAmount} onChange={e => setMonthlyForm({...monthlyForm, lopAmount: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase">Status</Label>
                  <Select value={monthlyForm.status} onValueChange={s => setMonthlyForm({...monthlyForm, status: s})}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Received">Received</SelectItem>
                      <SelectItem value="Not Received">Not Received</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-[10px] uppercase">Remarks</Label>
                  <Input 
                    className="h-8" 
                    placeholder="Payment notes..." 
                    value={monthlyForm.remarks} 
                    onChange={e => setMonthlyForm({...monthlyForm, remarks: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <div className="h-4" /> {/* Spacer to align with labels */}
                  <Button type="submit" size="sm" className="gradient-primary h-8 w-full">Add Record</Button>
                </div>
              </form>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-2"><History className="h-4 w-4" /> Payment History</h4>
              <div className="max-h-[300px] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                       <TableHead className="py-2 h-8 text-left uppercase text-[10px]">Period</TableHead>
                       <TableHead className="py-2 h-8 text-right uppercase text-[10px]">Gross Salary</TableHead>
                       <TableHead className="py-2 h-8 text-right uppercase text-[10px]">LOP Deduction</TableHead>
                       <TableHead className="py-2 h-8 text-right uppercase text-[10px] text-emerald-600">Net Paid</TableHead>
                       <TableHead className="py-2 h-8 text-center uppercase text-[10px]">Status</TableHead>
                       <TableHead className="py-2 h-8 text-center uppercase text-[10px]">Date</TableHead>
                       <TableHead className="py-2 h-8 text-right uppercase text-[10px]">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manageMonthlyUser?.monthlySalaries?.sort((a:any, b:any) => b.year - a.year || b.month - a.month).map((s: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="py-2 font-medium whitespace-nowrap text-left">{format(new Date(s.year, s.month-1, 1), 'MMM yyyy')}</TableCell>
                        <TableCell className="py-2 text-right text-xs">₹{(s.amount + (s.lopAmount || 0)).toLocaleString()}</TableCell>
                        <TableCell className="py-2 text-right text-xs text-rose-500">
                          {s.lopAmount > 0 ? `-₹${s.lopAmount.toLocaleString()}` : '₹0'}
                          {s.lopDays > 0 && <span className="ml-1 text-[10px] text-muted-foreground">({s.lopDays}d)</span>}
                        </TableCell>
                        <TableCell className="py-2 text-right font-bold text-emerald-600">₹{s.amount.toLocaleString()}</TableCell>
                        <TableCell className="py-2 text-center"><Badge className="bg-emerald-50 text-emerald-600 border-none px-1.5 py-0 text-[10px]">{s.status}</Badge></TableCell>
                        <TableCell className="py-2 text-center text-xs text-muted-foreground whitespace-nowrap">{s.paidDate ? format(new Date(s.paidDate), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell className="py-2 text-right">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleMonthlyDelete(s.month, s.year)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!manageMonthlyUser?.monthlySalaries?.length && (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">No records added yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminSalaryDetails;
