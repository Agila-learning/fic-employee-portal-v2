import { useState, useEffect, Fragment, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { operationService } from '@/api/operationService';
import { employeeService } from '@/api/employeeService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Download, TrendingDown, TrendingUp, Wallet, Users, Clock, Trash2, IndianRupee, BarChart3, Loader2, Pencil, X } from 'lucide-react';
import { cn, safeParseDate, getInitials } from '@/lib/utils';
import { createWorkbook, setColumnWidths, applyHeaderStyle, downloadWorkbook } from '@/utils/excelExport';
import { ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CATEGORIES } from './AdminExpenses';

interface EmployeeExpenseManagementProps {
  roleFilter?: 'employee' | 'admin' | 'md' | 'all';
}

const EmployeeExpenseManagement = ({ roleFilter = 'employee' }: EmployeeExpenseManagementProps) => {
  const { user } = useAuth();
  const isViewOnly = user?.role === 'sub-admin';
  const [expenses, setExpenses] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeList, setEmployeeList] = useState<any[]>([]);

  // Edit dialog state
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Tea/Coffee');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<string>('pending');
  const [editGivenBy, setEditGivenBy] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'expense'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'day' | 'week' | 'month'>('all');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [expData, credData, empData] = await Promise.all([
        operationService.getAllExpenses({}),
        operationService.getAllCredits({}),
        employeeService.getEmployees()
      ]);
      setExpenses(Array.isArray(expData) ? expData : []);
      setCredits(Array.isArray(credData) ? credData : []);
      setEmployeeList(Array.isArray(empData) ? empData.filter(e => e.is_active !== false) : []);
    } catch (error) {
      toast.error('Failed to fetch data');
      setExpenses([]);
      setCredits([]);
      setEmployeeList([]);
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

  const openEditDialog = (item: any) => {
    setEditItem(item);
    if (item.type === 'expense') {
      setEditDate(new Date(item.expense_date));
      setEditAmount(String(item.amount));
      setEditDesc(item.description || '');
      setEditStatus(item.approval_status || 'pending');
      setEditGivenBy('');
      setEditRole('');
      if (CATEGORIES.includes(item.category)) {
        setEditCategory(item.category);
        setEditCustomCategory('');
      } else {
        setEditCategory('Others');
        setEditCustomCategory(item.category || '');
      }
    } else {
      setEditDate(new Date(item.credit_date));
      setEditAmount(String(item.amount));
      setEditDesc(item.description || '');
      setEditGivenBy(item.given_by || '');
      setEditRole(item.given_by_role || '');
      setEditCategory('');
      setEditCustomCategory('');
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setEditSaving(true);
    try {
      if (editItem.type === 'expense') {
        const finalCategory = editCategory === 'Others' ? (editCustomCategory || 'Others') : editCategory;
        await operationService.updateExpense(editItem._id, {
          expense_date: format(editDate, 'yyyy-MM-dd'),
          amount: parseFloat(editAmount),
          description: editDesc,
          category: finalCategory,
          approval_status: editStatus,
        });
        toast.success('Expense updated');
      } else {
        await operationService.updateCredit(editItem._id, {
          credit_date: format(editDate, 'yyyy-MM-dd'),
          amount: parseFloat(editAmount),
          description: editDesc,
          given_by: editGivenBy,
          given_by_role: editRole,
        });
        toast.success('Credit updated');
      }
      setEditItem(null);
      fetchAll();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteEmployee = async (item: any) => {
    if (!window.confirm(`Delete this ${item.type}? This cannot be undone.`)) return;
    try {
      if (item.type === 'expense') {
        await operationService.deleteExpense(item._id);
      } else {
        await operationService.deleteCredit(item._id);
      }
      toast.success('Deleted');
      fetchAll();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const exportEmployeeExpenses = async () => {
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Employee Expenses');
    const headers = ['Employee Name', 'Date', 'Category', 'Description', 'Amount', 'Status'];
    setColumnWidths(ws, [20, 15, 15, 30, 12, 12]);
    ws.addRow(headers);
    applyHeaderStyle(ws, 6, '1F618D');

    expenses.filter(e => e && e.user_id?._id !== user?.id).forEach(e => {
      ws.addRow([
        e.user_id?.name || 'Unknown',
        e.expense_date ? format(safeParseDate(e.expense_date), 'dd-MM-yyyy') : '-',
        e.category || '-',
        e.description || '-',
        e.amount || 0,
        e.approval_status || 'pending'
      ]);
    });

    await downloadWorkbook(wb, `Employee_Expenses_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Report downloaded');
  };

  // Merged, filtered and sorted list of ALL employee transactions (excluding admin's own)
  const allTransactions = useMemo(() => {
    let filteredExp = Array.isArray(expenses) ? expenses.filter(e => {
      if (!e) return false;
      const isExcludeMe = e.user_id?._id !== user?.id;
      if (!isExcludeMe) return false;
      
      if (roleFilter !== 'all' && (e.user_id?.role || 'employee') !== roleFilter) return false;
      return true;
    }).map(e => ({ ...e, type: 'expense' })) : [];
    
    let filteredCreds = Array.isArray(credits) ? credits.filter(c => {
      if (!c) return false;
      const isExcludeMe = c.user_id?._id !== user?.id;
      if (!isExcludeMe) return false;
      
      if (roleFilter !== 'all' && (c.user_id?.role || 'employee') !== roleFilter) return false;
      return true;
    }).map(c => ({ ...c, type: 'credit' })) : [];
    
    let combined = [...filteredExp, ...filteredCreds];

    // Apply Type Filter
    if (typeFilter !== 'all') {
      combined = combined.filter(t => t.type === typeFilter);
    }

    // Apply Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(t => 
        (t.user_id?.name || '').toLowerCase().includes(q) || 
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      );
    }

    // Apply Date Filter
    if (startDate) {
      combined = combined.filter(t => new Date(t.expense_date || t.credit_date) >= startDate);
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      combined = combined.filter(t => new Date(t.expense_date || t.credit_date) <= endOfDay);
    }
    
    return combined.sort((a, b) => new Date(b?.expense_date || b?.credit_date || 0).getTime() - new Date(a?.expense_date || a?.credit_date || 0).getTime());
  }, [expenses, credits, user, roleFilter, typeFilter, searchQuery, startDate, endDate]);

  const stats = useMemo(() => {
    const filteredTransactions = allTransactions;
    const pendingCount = Array.isArray(expenses) ? expenses.filter(e => 
      e.approval_status === 'pending' && 
      e.user_id?._id !== user?.id && 
      (roleFilter === 'all' || e.user_id?.role === roleFilter)
    ).length : 0;

    const totalApprovedExp = filteredTransactions
      .filter(t => t.type === 'expense' && t.approval_status === 'approved')
      .reduce((s, t) => s + Number(t.amount || 0), 0);
      
    const totalCredited = filteredTransactions
      .filter(t => t.type === 'credit')
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const activeEmployeesCount = new Set(filteredTransactions.map(t => t.user_id?._id)).size;
    
    return { pendingCount, totalApprovedExp, totalCredited, activeEmployeesCount };
  }, [allTransactions, expenses, user, roleFilter]);

  const utilizationData = useMemo(() => {
    const safeEmps = Array.isArray(employeeList) ? employeeList : [];
    const safeExp = Array.isArray(expenses) ? expenses : [];
    const safeCreds = Array.isArray(credits) ? credits : [];
    
    return safeEmps.filter(emp => {
      if (!emp || emp._id === user?.id) return false;
      if (roleFilter !== 'all' && (emp.role || (emp as any).role || 'employee') !== roleFilter) return false;
      return true;
    }).map(emp => {
      const exp = safeExp.filter(e => {
        if (!e) return false;
        const uid = e.user_id?._id || e.user_id;
        return uid === emp._id && e.approval_status === 'approved';
      }).reduce((s, e) => s + Number(e?.amount || 0), 0);
      
      const cred = safeCreds.filter(c => {
        if (!c) return false;
        const uid = c.user_id?._id || c.user_id;
        return uid === emp._id;
      }).reduce((s, c) => s + Number(c?.amount || 0), 0);
      
      return { 
        name: (emp.name || 'Unknown').split(' ')[0], 
        expense: isNaN(exp) ? 0 : exp, 
        balance: isNaN(cred - exp) ? 0 : cred - exp 
      };
    }).filter(d => d && (d.expense > 0 || d.balance !== 0));
  }, [employeeList, expenses, credits, user]);

  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: any[] } = {};
    allTransactions.forEach(item => {
      const date = item.expense_date || item.credit_date;
      if (!date) return;
      const dateStr = format(safeParseDate(date), 'yyyy-MM-dd');
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(item);
    });
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => ({
      date,
      items: groups[date]
    }));
  }, [allTransactions]);

  const dailyStats = useMemo(() => {
    const groups: { [date: string]: { credits: number, expenses: number, count: number } } = {};
    allTransactions.forEach(item => {
      const date = item.expense_date || item.credit_date;
      if (!date) return;
      const dateStr = format(safeParseDate(date), 'yyyy-MM-dd');
      if (!groups[dateStr]) groups[dateStr] = { credits: 0, expenses: 0, count: 0 };
      if (item.type === 'credit') {
        groups[dateStr].credits += Number(item.amount || 0);
      } else if (item.approval_status === 'approved') {
        groups[dateStr].expenses += Number(item.amount || 0);
      }
      groups[dateStr].count += 1;
    });
    return Object.keys(groups).sort((a, b) => a.localeCompare(b)).map(date => ({
      date: format(safeParseDate(date), 'dd MMM'),
      fullDate: date,
      credits: groups[date].credits,
      expenses: groups[date].expenses,
      net: groups[date].credits - groups[date].expenses
    }));
  }, [allTransactions]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-6">
        {/* Filters and Search */}
        <div className="bg-card/30 backdrop-blur-md p-4 rounded-xl border border-border/50 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Search Transactions</label>
            <div className="relative">
              <Input 
                placeholder="Search employee, category, description..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 border-border/50 h-10 text-sm"
              />
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-50" />
            </div>
          </div>
          
          <div className="w-full md:w-[150px] space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Type</label>
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="bg-background/50 border-border/50 h-10 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit">Credits Only</SelectItem>
                <SelectItem value="expense">Debits (Expenses)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-[240px] space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Date Range</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal bg-background/50 border-border/50 h-10 text-xs", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd MMM") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal bg-background/50 border-border/50 h-10 text-xs", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd MMM") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {(searchQuery || startDate || endDate || typeFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setSearchQuery('');
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setTypeFilter('all');
                }}
                className="h-10 w-10 text-muted-foreground hover:text-destructive"
                title="Clear Filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={exportEmployeeExpenses} variant="outline" className="gap-2 h-10 bg-background/50 border-border/50">
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:ring-1 hover:ring-primary/20 transition-all">
            {loading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-bold"><Clock className="h-3 w-3" /> Pending</div>
                <div className="h-7 w-7 rounded-full bg-amber-500/10 flex items-center justify-center"><Clock className="h-3.5 w-3.5 text-amber-500" /></div>
              </div>
              <p className="text-2xl font-black text-amber-600 mt-2">{stats.pendingCount}</p>
              <div className="mt-1 h-1 w-full bg-amber-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "40%" }} className="h-full bg-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:ring-1 hover:ring-red-500/20 transition-all">
            {loading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-bold"><TrendingDown className="h-3 w-3" /> Exp. Approved</div>
                <div className="h-7 w-7 rounded-full bg-red-500/10 flex items-center justify-center"><TrendingDown className="h-3.5 w-3.5 text-red-500" /></div>
              </div>
              <p className="text-2xl font-black text-destructive mt-2">₹{stats.totalApprovedExp.toLocaleString()}</p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="font-bold text-red-500">Total Spent</span> throughout period
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:ring-1 hover:ring-emerald-500/20 transition-all">
            {loading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-bold"><TrendingUp className="h-3 w-3" /> Total Credits</div>
                <div className="h-7 w-7 rounded-full bg-emerald-500/10 flex items-center justify-center"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" /></div>
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2">₹{stats.totalCredited.toLocaleString()}</p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="font-bold text-emerald-500">{stats.activeEmployeesCount} Employees</span> tracked
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:ring-1 hover:ring-blue-500/20 transition-all">
            {loading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-bold"><Wallet className="h-3 w-3" /> Net Liquidity</div>
                <div className="h-7 w-7 rounded-full bg-blue-500/10 flex items-center justify-center"><Wallet className="h-3.5 w-3.5 text-blue-500" /></div>
              </div>
              <p className={cn("text-2xl font-black mt-2", (stats.totalCredited - stats.totalApprovedExp) >= 0 ? "text-emerald-600" : "text-destructive")}>
                ₹{(stats.totalCredited - stats.totalApprovedExp).toLocaleString()}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={cn("font-bold", (stats.totalCredited - stats.totalApprovedExp) >= 0 ? "text-emerald-500" : "text-destructive")}>
                  {(stats.totalCredited - stats.totalApprovedExp) >= 0 ? "SURPLUS" : "DEFICIT"}
                </span> remaining balance
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Employee</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-right text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(expenses) ? expenses : []).filter(e => {
                    if (!e || e.approval_status !== 'pending' || e.user_id?._id === user?.id) return false;
                    if (roleFilter !== 'all' && (e.user_id?.role || (e as any).role || 'employee') !== roleFilter) return false;
                    return true;
                  }).length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-xs">No pending approvals</TableCell></TableRow>
                  ) : (Array.isArray(expenses) ? expenses : [])
                    .filter(e => {
                        if (!e || e.approval_status !== 'pending' || e.user_id?._id === user?.id) return false;
                        if (roleFilter !== 'all' && (e.user_id?.role || (e as any).role || 'employee') !== roleFilter) return false;
                        return true;
                    })
                    .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
                    .map(e => (
                    <TableRow key={e?._id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell className="text-xs py-2 whitespace-nowrap">
                        {e?.expense_date ? format(safeParseDate(e.expense_date), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-xs py-2 font-medium">{e?.user_id?.name || 'Employee'}</TableCell>
                      <TableCell className="text-xs py-2">{e?.category || '-'}</TableCell>
                      <TableCell className="text-xs py-2">
                        <div className="max-w-[200px] truncate" title={e?.description}>{e?.description || '-'}</div>
                      </TableCell>
                      <TableCell className="text-xs py-2 font-bold text-destructive">₹{e?.amount || 0}</TableCell>
                      <TableCell className="text-right py-2">
                        {!isViewOnly && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-[10px] px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                              onClick={() => e && handleApproval(e._id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-[10px] px-2 text-destructive border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                              onClick={() => e && handleApproval(e._id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-muted/30 p-1 mb-4 h-9">
            <TabsTrigger value="overview" className="text-xs h-7">Financial Overview</TabsTrigger>
            <TabsTrigger value="credits" className="text-xs h-7">Daily Credit Tracking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" /> Employee Summaries
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Employee</TableHead>
                        <TableHead className="text-xs text-emerald-600">Total Credits</TableHead>
                        <TableHead className="text-xs text-destructive">Total Expenses</TableHead>
                        <TableHead className="text-right text-xs">Current Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(employeeList) ? employeeList : []).filter(emp => {
                        if (!emp || emp._id === user?.id) return false;
                        const empRole = emp.role || (emp as any).role || 'employee';
                        if (roleFilter !== 'all' && empRole !== roleFilter) return false;
                        return true;
                      }).map(emp => {
                        const empExp = (Array.isArray(expenses) ? expenses : []).filter(e => e && (e.user_id?._id === emp._id || e.user_id === emp._id) && e.approval_status === 'approved').reduce((s, e) => s + Number(e.amount || 0), 0);
                        const empCred = (Array.isArray(credits) ? credits : []).filter(c => c && (c.user_id?._id === emp._id || c.user_id === emp._id)).reduce((s, c) => s + Number(c.amount || 0), 0);
                        const balance = empCred - empExp;
                        return (
                          <TableRow key={emp._id} className="group hover:bg-muted/50 transition-colors">
                            <TableCell className="text-xs py-3 font-medium flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                {getInitials(emp.name)}
                              </div>
                              {emp.name || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-xs py-3 text-emerald-600 font-bold">₹{empCred.toLocaleString()}</TableCell>
                            <TableCell className="text-xs py-3 text-destructive font-bold">₹{empExp.toLocaleString()}</TableCell>
                            <TableCell className={cn("text-right text-xs py-3 font-black", balance >= 0 ? "text-emerald-600" : "text-destructive")}>
                              ₹{isNaN(balance) ? 0 : balance.toLocaleString()}
                              {balance < 0 && <Badge variant="outline" className="ml-2 text-[8px] bg-red-50 text-red-600 border-red-200 uppercase px-1">Deficit</Badge>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits">
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" /> Day-wise Credit Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs text-emerald-600">Credits Added</TableHead>
                        <TableHead className="text-xs text-destructive">Expenses</TableHead>
                        <TableHead className="text-right text-xs">Daily Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyStats.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-xs">No data for selected period</TableCell></TableRow>
                      ) : dailyStats.slice().reverse().map(stat => (
                        <TableRow key={stat.fullDate}>
                          <TableCell className="text-xs py-3 font-medium">{format(safeParseDate(stat.fullDate), 'dd MMM yyyy')}</TableCell>
                          <TableCell className="text-xs py-3 text-emerald-600 font-bold">₹{stat.credits.toLocaleString()}</TableCell>
                          <TableCell className="text-xs py-3 text-destructive font-bold">₹{stat.expenses.toLocaleString()}</TableCell>
                          <TableCell className={cn("text-right text-xs py-3 font-black", stat.net >= 0 ? "text-emerald-600" : "text-destructive")}>
                            {stat.net >= 0 ? '+' : '-'}₹{Math.abs(stat.net).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full"
      >
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/10">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Financial Trends</div>
              <div className="flex gap-2">
                 <Button onClick={() => setTimeFilter('all')} size="sm" variant={timeFilter === 'all' ? "default" : "ghost"} className="h-6 text-[10px]">Employee Utilization</Button>
                 <Button onClick={() => setTimeFilter('day')} size="sm" variant={timeFilter === 'day' ? "default" : "ghost"} className="h-6 text-[10px]">Daily Trends</Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[400px] relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary/30" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeFilter === 'day' ? dailyStats : utilizationData}
                  layout="horizontal"
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                  <XAxis dataKey={timeFilter === 'day' ? "date" : "name"} angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  />
                  <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingBottom: '20px' }} />
                  <Bar dataKey={timeFilter === 'day' ? "credits" : "expense"} fill={timeFilter === 'day' ? "#10b981" : "#ef4444"} radius={[4, 4, 0, 0]} barSize={30} name={timeFilter === 'day' ? "Credits (₹)" : "Spent (₹)"} />
                  <Bar dataKey={timeFilter === 'day' ? "expenses" : "balance"} fill={timeFilter === 'day' ? "#ef4444" : "#10b981"} radius={[4, 4, 0, 0]} barSize={30} name={timeFilter === 'day' ? "Expenses (₹)" : "Balance (₹)"} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-muted/30 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            All Employee Transactions
          </CardTitle>
          <span className="text-xs text-muted-foreground">{allTransactions.length} entries</span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : allTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No employee transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="w-8">S.No</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedTransactions.map((group) => (
                    <Fragment key={group.date}>
                      <TableRow key={group.date} className="bg-muted/10">
                        <TableCell colSpan={8} className="py-2 px-4">
                          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                            {format(safeParseDate(group.date), 'dd MMMM yyyy')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {group.items.map((item, index) => (
                        <TableRow key={item?._id || index} className="group hover:bg-muted/30 transition-colors">
                          <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="text-xs font-medium">{item?.user_id?.name || 'Employee'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-[10px] uppercase", item?.type === 'expense' ? "text-destructive border-destructive" : "text-emerald-600 border-emerald-600")}>
                                {item?.type === 'expense' ? 'Debit' : 'Credit'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {item ? format(safeParseDate(item.expense_date || item.credit_date), 'dd MMM yyyy') : '—'}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-medium">{item.category || item.given_by || (item.type === 'credit' ? 'Company Credit' : 'Other')}</div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{item.description || '—'}</div>
                          </TableCell>
                          <TableCell className={cn("text-right font-bold text-xs", item.type === 'expense' ? "text-destructive" : "text-emerald-600")}>
                            {item.type === 'expense' ? '-' : '+'}₹{Number(item.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {item.type === 'expense' ? (
                              <Badge variant="outline" className={cn("text-[10px]",
                                item.approval_status === 'approved' ? 'text-emerald-600 border-emerald-600' :
                                  item.approval_status === 'rejected' ? 'text-destructive border-destructive' :
                                    'text-amber-600 border-amber-600'
                              )}>
                                {item.approval_status || 'pending'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-600">Credit</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!isViewOnly && (
                              <div className="flex items-center gap-1 justify-end">
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7 hover:text-primary hover:bg-primary/10"
                                  onClick={() => openEditDialog(item)}
                                  title="Edit"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7 hover:text-red-500 hover:bg-red-50"
                                  onClick={() => handleDeleteEmployee(item)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl border border-border/50 w-full max-w-md mx-4 animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border/40">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                Edit {editItem.type === 'expense' ? 'Expense (Debit)' : 'Credit'} — {editItem.user_id?.name}
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItem(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs border-border/50">
                      <CalendarIcon className="mr-2 h-3 w-3" /> {format(editDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={editDate} onSelect={(d) => d && setEditDate(d)} className="p-3" />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Amount (₹)</label>
                <Input type="number" placeholder="0.00" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="border-border/50 h-8 text-xs" />
              </div>

              {editItem.type === 'expense' ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium">Category</label>
                  <div className="flex gap-2">
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger className="border-border/50 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {editCategory === 'Others' && (
                      <Input placeholder="Manual entry..." value={editCustomCategory} onChange={e => setEditCustomCategory(e.target.value)} className="border-border/50 h-8 text-xs flex-1" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Given By</label>
                    <Input placeholder="Name" value={editGivenBy} onChange={e => setEditGivenBy(e.target.value)} className="border-border/50 h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Role</label>
                    <Input placeholder="Title" value={editRole} onChange={e => setEditRole(e.target.value)} className="border-border/50 h-8 text-xs" />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium">Description</label>
                <Input placeholder="Details..." value={editDesc} onChange={e => setEditDesc(e.target.value)} className="border-border/50 h-8 text-xs" />
              </div>

              {editItem.type === 'expense' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">Approval Status</label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="border-border/50 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end p-5 pt-0">
              <Button variant="outline" size="sm" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={!editAmount || editSaving} className="gap-1">
                {editSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pencil className="h-3 w-3" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EmployeeExpenseManagement;

