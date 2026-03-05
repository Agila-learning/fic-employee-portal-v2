import { useState, useEffect, useRef, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { operationService } from '@/api/operationService';
import { employeeService } from '@/api/employeeService';
import { leadService } from '@/api/leadService';
import { toast } from 'sonner';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { CalendarIcon, Download, TrendingDown, TrendingUp, Wallet, Users, Clock, Plus, Trash2, IndianRupee, Upload, FileImage, BarChart3, ExternalLink, Loader2 } from 'lucide-react';
import { cn, safeParseDate } from '@/lib/utils';
import { createWorkbook, setColumnWidths, applyHeaderStyle, downloadWorkbook, styleCell } from '@/utils/excelExport';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#06b6d4', '#e11d48'];

const CATEGORIES = [
  'Tea/Coffee', 'Snacks', 'Pooja Materials', 'Office Use Things',
  'Sanitary Products', 'Food', 'Transport', 'Travel',
  'Office Supplies', 'Courier Charges', 'Petrol', 'Marketing', 'Lead Generation', 'Others'
];

const AdminExpenses = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-expenses');

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading flex items-center gap-2">
            <IndianRupee className="h-6 w-6 text-primary" />
            Expense Management
          </h1>
          <p className="text-muted-foreground">Manage personal and employee expenses</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
            <TabsTrigger value="my-expenses">My Expenses</TabsTrigger>
            <TabsTrigger value="employee-expenses">Employee Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="my-expenses" className="mt-6">
            <AdminMyExpenses />
          </TabsContent>

          <TabsContent value="employee-expenses" className="mt-6">
            <EmployeeExpenseManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const AdminMyExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeView, setTimeView] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all');

  const [expDate, setExpDate] = useState<Date>(new Date());
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState('Tea/Coffee');
  const [customCategory, setCustomCategory] = useState('');
  const [expPaidTo, setExpPaidTo] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [credDate, setCredDate] = useState<Date>(new Date());
  const [credAmount, setCredAmount] = useState('');
  const [credGivenBy, setCredGivenBy] = useState('');
  const [credRole, setCredRole] = useState('');
  const [credDesc, setCredDesc] = useState('');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [expData, credData] = await Promise.all([
        operationService.getMyExpenses(),
        operationService.getMyCredits()
      ]);
      setExpenses(expData || []);
      setCredits(credData || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleAddExpense = async () => {
    if (!expAmount || !expDesc || !user) return;
    setUploading(true);
    let receiptPath: string | null = null;
    if (receiptFile) {
      try {
        const res = await leadService.uploadFile(receiptFile, 'expense-receipts', user.id);
        receiptPath = res.path;
      } catch (error) {
        toast.error('Receipt upload failed');
      }
    }
    const finalCategory = expCategory === 'Others' ? (customCategory || 'Others') : expCategory;
    try {
      await operationService.createExpense({
        expense_date: format(expDate, 'yyyy-MM-dd'), amount: parseFloat(expAmount),
        description: expDesc, category: finalCategory, receipt_url: receiptPath, approval_status: 'approved',
        paid_to: expPaidTo || null,
      });
      toast.success('Expense added');
      fetchData();
      setExpAmount(''); setExpDesc(''); setExpPaidTo(''); setReceiptFile(null); setCustomCategory('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast.error('Failed to add expense');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await operationService.deleteExpense(id);
      toast.success('Deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleAddCredit = async () => {
    if (!credAmount || !credGivenBy || !user) return;
    try {
      await operationService.createCredit({
        credit_date: format(credDate, 'yyyy-MM-dd'), amount: parseFloat(credAmount),
        given_by: credGivenBy, given_by_role: credRole, description: credDesc || null,
      });
      toast.success('Credit added');
      fetchData();
      setCredAmount(''); setCredGivenBy(''); setCredRole(''); setCredDesc('');
    } catch (error) {
      toast.error('Failed to add credit');
    }
  };

  const handleDeleteCredit = async (id: string) => {
    try {
      await operationService.deleteCredit(id);
      toast.success('Deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleViewReceipt = async (path: string) => {
    try {
      const data = await leadService.getSignedUrl('expense-receipts', path);
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (error) {
      toast.error('Failed to get receipt URL');
    }
  };

  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses]);
  const totalCredited = useMemo(() => credits.reduce((s, c) => s + Number(c.amount), 0), [credits]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingDown className="h-4 w-4" /> Total Spent</div>
            <p className="text-2xl font-bold text-destructive mt-1">₹{totalSpent.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> Total Credited</div>
            <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalCredited.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="h-4 w-4" /> Balance</div>
            <p className={cn("text-2xl font-bold mt-1", totalCredited - totalSpent >= 0 ? "text-emerald-600" : "text-destructive")}>₹{(totalCredited - totalSpent).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debit Section */}
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/10">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <TrendingDown className="h-5 w-5" /> Add Debit (Expense)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs border-border/50">
                      <CalendarIcon className="mr-2 h-3 w-3" /> {format(expDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={expDate} onSelect={(d) => d && setExpDate(d)} className="p-3" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Category</label>
                <div className="flex gap-2">
                  <Select value={expCategory} onValueChange={setExpCategory}>
                    <SelectTrigger className="border-border/50 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input size="sm" placeholder="Manual entry..." value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="border-border/50 h-8 text-xs flex-1" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Amount (₹)</label>
                <Input size="sm" type="number" placeholder="0.00" value={expAmount} onChange={e => setExpAmount(e.target.value)} className="border-border/50 h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Paid To</label>
                <Input size="sm" placeholder="e.g. Amazon" value={expPaidTo} onChange={e => setExpPaidTo(e.target.value)} className="border-border/50 h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Description</label>
              <Input size="sm" placeholder="Details..." value={expDesc} onChange={e => setExpDesc(e.target.value)} className="border-border/50 h-8 text-xs" />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1">
                <Input ref={fileInputRef} type="file" className="hidden" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full gap-2 text-xs border-dashed">
                  {receiptFile ? <><FileImage className="h-3 w-3" /> {receiptFile.name.slice(0, 10)}...</> : <><Upload className="h-3 w-3" /> Receipt</>}
                </Button>
              </div>
              <Button onClick={handleAddExpense} size="sm" className="bg-destructive hover:bg-destructive/90 text-white gap-2 text-xs" disabled={!expAmount || !expDesc || uploading}>
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add Debit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Credit Section */}
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/10">
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-600">
              <TrendingUp className="h-5 w-5" /> Add Credit
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs border-border/50">
                      <CalendarIcon className="mr-2 h-3 w-3" /> {format(credDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={credDate} onSelect={(d) => d && setCredDate(d)} className="p-3" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Amount (₹)</label>
                <Input size="sm" type="number" placeholder="0.00" value={credAmount} onChange={e => setCredAmount(e.target.value)} className="border-border/50 h-8 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Given By</label>
                <Input size="sm" placeholder="Internal/CEO" value={credGivenBy} onChange={e => setCredGivenBy(e.target.value)} className="border-border/50 h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Role</label>
                <Input size="sm" placeholder="Title" value={credRole} onChange={e => setCredRole(e.target.value)} className="border-border/50 h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Description</label>
              <Input size="sm" placeholder="Optional notes..." value={credDesc} onChange={e => setCredDesc(e.target.value)} className="border-border/50 h-8 text-xs" />
            </div>
            <div className="pt-2 text-right">
              <Button onClick={handleAddCredit} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs" disabled={!credAmount || !credGivenBy}>
                <Plus className="h-3 w-3" /> Add Credit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : [...expenses.map(e => ({ ...e, type: 'debit' })), ...credits.map(c => ({ ...c, type: 'credit' }))].sort((a, b) => new Date(b.expense_date || b.credit_date).getTime() - new Date(a.expense_date || a.credit_date).getTime()).map(item => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] uppercase", item.type === 'debit' ? "text-destructive border-destructive" : "text-emerald-600 border-emerald-600")}>
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{item.expense_date || item.credit_date ? format(safeParseDate(item.expense_date || item.credit_date), 'dd MMM yyyy') : '—'}</TableCell>
                    <TableCell>
                      <div className="text-xs font-medium">{item.category || item.given_by || (item.type === 'credit' ? 'Company Credit' : 'Other')}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{item.description}</div>
                    </TableCell>
                    <TableCell className={cn("text-right font-bold text-xs", item.type === 'debit' ? "text-destructive" : "text-emerald-600")}>
                      {item.type === 'debit' ? '-' : '+'}₹{Number(item.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => item.type === 'debit' ? handleDeleteExpense(item._id) : handleDeleteCredit(item._id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const EmployeeExpenseManagement = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeList, setEmployeeList] = useState<any[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [expData, credData, empData] = await Promise.all([
        operationService.getAllExpenses({}),
        operationService.getAllCredits({}),
        employeeService.getEmployees()
      ]);
      setExpenses(expData || []);
      setCredits(credData || []);
      setEmployeeList(empData || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await operationService.updateExpenseStatus(id, status);
      toast.success(`Expense ${status}`);
      fetchAll();
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const exportEmployeeExpenses = async () => {
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Employee Expenses');
    const headers = ['Employee Name', 'Date', 'Category', 'Description', 'Amount', 'Status'];
    setColumnWidths(ws, [20, 15, 15, 30, 12, 12]);
    ws.addRow(headers);
    applyHeaderStyle(ws, 6, '1F618D');

    expenses.filter(e => e.user_id?._id !== user?.id).forEach(e => {
      ws.addRow([
        e.user_id?.name || 'Unknown',
        format(safeParseDate(e.expense_date), 'dd-MM-yyyy'),
        e.category,
        e.description,
        e.amount,
        e.approval_status
      ]);
    });

    await downloadWorkbook(wb, `Employee_Expenses_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Report downloaded');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={exportEmployeeExpenses} size="sm" variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export Employee Expenses
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Pending Approvals</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {expenses.filter(e => e.approval_status === 'pending' && e.user_id?._id !== user?.id).map(e => (
                  <TableRow key={e._id}>
                    <TableCell className="text-xs font-medium">{e.user_id?.name || 'Employee'}</TableCell>
                    <TableCell className="text-xs font-bold text-destructive">₹{e.amount}</TableCell>
                    <TableCell className="text-right flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-600" onClick={() => handleApproval(e._id, 'approved')}>Approve</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => handleApproval(e._id, 'rejected')}>Reject</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Employee Summaries</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead className="text-right">Net Balance</TableHead></TableRow></TableHeader>
              <TableBody>
                {employeeList.filter(emp => emp._id !== user?.id).map(emp => {
                  const empExp = expenses.filter(e => (e.user_id?._id === emp._id || e.user_id === emp._id) && e.approval_status === 'approved').reduce((s, e) => s + Number(e.amount), 0);
                  const empCred = credits.filter(c => c.user_id?._id === emp._id || c.user_id === emp._id).reduce((s, c) => s + Number(c.amount), 0);
                  return (
                    <TableRow key={emp._id}>
                      <TableCell className="text-xs">{emp.name}</TableCell>
                      <TableCell className={cn("text-right text-xs font-bold", (empCred - empExp) >= 0 ? "text-emerald-600" : "text-destructive")}>
                        ₹{(empCred - empExp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminExpenses;
