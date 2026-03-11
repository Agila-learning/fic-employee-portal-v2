import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { operationService } from '@/api/operationService';
import { employeeService } from '@/api/employeeService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarIcon, Download, TrendingDown, TrendingUp, Wallet, Users, Clock, Trash2, IndianRupee, BarChart3, Loader2, Pencil, X } from 'lucide-react';
import { cn, safeParseDate } from '@/lib/utils';
import { createWorkbook, setColumnWidths, applyHeaderStyle, downloadWorkbook } from '@/utils/excelExport';
import { ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CATEGORIES } from './AdminExpenses';

const EmployeeExpenseManagement = () => {
  const { user } = useAuth();
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
      setEmployeeList(Array.isArray(empData) ? empData : []);
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

  // Merged, sorted list of ALL employee transactions (excluding admin's own)
  const allTransactions = useMemo(() => {
    const safeExp = Array.isArray(expenses) ? expenses.filter(e => e && e.user_id?._id !== user?.id).map(e => ({ ...e, type: 'expense' })) : [];
    const safeCreds = Array.isArray(credits) ? credits.filter(c => c && c.user_id?._id !== user?.id).map(c => ({ ...c, type: 'credit' })) : [];
    
    return [...safeExp, ...safeCreds].sort((a, b) => new Date(b?.expense_date || b?.credit_date || 0).getTime() - new Date(a?.expense_date || a?.credit_date || 0).getTime());
  }, [expenses, credits, user]);

  const stats = useMemo(() => {
    const safeExpenses = Array.isArray(expenses) ? expenses.filter(e => e) : [];
    const safeCredits = Array.isArray(credits) ? credits.filter(c => c) : [];
    const pendingCount = safeExpenses.filter(e => e.approval_status === 'pending' && e.user_id?._id !== user?.id).length;
    const totalApprovedExp = safeExpenses.filter(e => e.approval_status === 'approved' && e.user_id?._id !== user?.id).reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalCredited = safeCredits.filter(c => c.user_id?._id !== user?.id).reduce((s, c) => s + Number(c.amount || 0), 0);
    return { pendingCount, totalApprovedExp, totalCredited };
  }, [expenses, credits, user]);

  const utilizationData = useMemo(() => {
    const safeEmps = Array.isArray(employeeList) ? employeeList : [];
    const safeExp = Array.isArray(expenses) ? expenses : [];
    const safeCreds = Array.isArray(credits) ? credits : [];
    
    return safeEmps.filter(emp => emp && emp._id !== user?.id).map(emp => {
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm relative overflow-hidden">
            {loading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> Pending</div>
              <p className="text-xl font-bold text-amber-600 mt-1">{stats.pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm relative overflow-hidden">
            {loading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingDown className="h-3 w-3" /> Exp. Approved</div>
              <p className="text-xl font-bold text-destructive mt-1">₹{stats.totalApprovedExp.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm relative overflow-hidden">
            {loading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="h-3 w-3" /> Total Credits</div>
              <p className="text-xl font-bold text-emerald-600 mt-1">₹{stats.totalCredited.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm relative overflow-hidden">
            {loading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="h-3 w-3" /> Net Liquidity</div>
              <p className={cn("text-xl font-bold mt-1", (stats.totalCredited - stats.totalApprovedExp) >= 0 ? "text-emerald-600" : "text-destructive")}>
                ₹{(stats.totalCredited - stats.totalApprovedExp).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
        <Button onClick={exportEmployeeExpenses} size="sm" variant="outline" className="gap-2 shrink-0">
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Pending Approvals</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/30"><TableHead className="text-[10px]">Employee</TableHead><TableHead className="text-[10px]">Amount</TableHead><TableHead className="text-right text-[10px]">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(Array.isArray(expenses) ? expenses : []).filter(e => e && e.approval_status === 'pending' && e.user_id?._id !== user?.id).length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-xs">No pending approvals</TableCell></TableRow>
                    ) : (Array.isArray(expenses) ? expenses : []).filter(e => e && e.approval_status === 'pending' && e.user_id?._id !== user?.id).map(e => (
                      <TableRow key={e?._id} className="group hover:bg-muted/50 transition-colors">
                        <TableCell className="text-[10px] py-2">{e?.user_id?.name || 'Employee'}</TableCell>
                        <TableCell className="text-[10px] py-2 font-bold text-destructive">₹{e?.amount || 0}</TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600 hover:bg-emerald-50" onClick={() => e && handleApproval(e._id, 'approved')} title="Approve"><Pencil className="h-3 w-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-red-50" onClick={() => e && handleApproval(e._id, 'rejected')} title="Reject"><X className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /> Employee Summaries</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/30"><TableHead className="text-[10px]">Employee</TableHead><TableHead className="text-right text-[10px]">Balance</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(Array.isArray(employeeList) ? employeeList : []).filter(emp => emp && emp._id !== user?.id).map(emp => {
                      const empExp = (Array.isArray(expenses) ? expenses : []).filter(e => e && (e.user_id?._id === emp._id || e.user_id === emp._id) && e.approval_status === 'approved').reduce((s, e) => s + Number(e.amount || 0), 0);
                      const empCred = (Array.isArray(credits) ? credits : []).filter(c => c && (c.user_id?._id === emp._id || c.user_id === emp._id)).reduce((s, c) => s + Number(c.amount || 0), 0);
                      const balance = empCred - empExp;
                      return (
                        <TableRow key={emp._id} className="group hover:bg-muted/50 transition-colors">
                          <TableCell className="text-[10px] py-2">{emp.name || 'Unknown'}</TableCell>
                          <TableCell className={cn("text-right text-[10px] py-2 font-bold", balance >= 0 ? "text-emerald-600" : "text-destructive")}>
                            ₹{isNaN(balance) ? 0 : balance.toLocaleString()}
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

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/10"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Credit Utilization</CardTitle></CardHeader>
          <CardContent className="p-4 h-[250px] relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary/30" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={utilizationData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border)/0.3)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={10} name="Spent" />
                  <Bar dataKey="balance" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10} name="Balance" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

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
                  {allTransactions.map((item, index) => (
                    <TableRow key={item?._id || index}>
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
                      </TableCell>
                    </TableRow>
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
