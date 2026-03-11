import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { CalendarIcon, Download, TrendingDown, TrendingUp, Wallet, Users, Clock, Plus, Trash2, IndianRupee, Upload, FileImage, BarChart3, ExternalLink, Loader2, Pencil, X } from 'lucide-react';
import { cn, safeParseDate } from '@/lib/utils';
import { createWorkbook, setColumnWidths, applyHeaderStyle, downloadWorkbook, styleCell } from '@/utils/excelExport';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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

  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [editCreditId, setEditCreditId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [expData, credData] = await Promise.all([
        operationService.getMyExpenses(),
        operationService.getMyCredits()
      ]);
      setExpenses(Array.isArray(expData) ? expData : []);
      setCredits(Array.isArray(credData) ? credData : []);
    } catch (error) {
      toast.error('Failed to fetch data');
      setExpenses([]);
      setCredits([]);
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
    const payload = {
      expense_date: format(expDate, 'yyyy-MM-dd'), amount: parseFloat(expAmount),
      description: expDesc, category: finalCategory, receipt_url: receiptPath || undefined, approval_status: 'approved',
      paid_to: expPaidTo || null,
    };
    try {
      if (editExpenseId) {
        if (!receiptPath) delete payload.receipt_url; // Don't overwrite if not uploading new
        await operationService.updateExpense(editExpenseId, payload);
        toast.success('Expense updated');
        setEditExpenseId(null);
      } else {
        await operationService.createExpense(payload);
        toast.success('Expense added');
      }
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
    const payload = {
      credit_date: format(credDate, 'yyyy-MM-dd'), amount: parseFloat(credAmount),
      given_by: credGivenBy, given_by_role: credRole, description: credDesc || null,
    };
    try {
      if (editCreditId) {
        await operationService.updateCredit(editCreditId, payload);
        toast.success('Credit updated');
        setEditCreditId(null);
      } else {
        await operationService.createCredit(payload);
        toast.success('Credit added');
      }
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

  const handleEditClick = (item: any) => {
    if (item.type === 'debit') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setEditExpenseId(item._id);
      setExpDate(new Date(item.expense_date));
      setExpAmount(item.amount.toString());
      setExpDesc(item.description || '');
      setExpPaidTo(item.paid_to || '');
      if (CATEGORIES.includes(item.category)) {
        setExpCategory(item.category);
        setCustomCategory('');
      } else {
        setExpCategory('Others');
        setCustomCategory(item.category || '');
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setEditCreditId(item._id);
      setCredDate(new Date(item.credit_date));
      setCredAmount(item.amount.toString());
      setCredGivenBy(item.given_by || '');
      setCredRole(item.given_by_role || '');
      setCredDesc(item.description || '');
    }
  };

  const totalSpent = useMemo(() => (Array.isArray(expenses) ? expenses : []).reduce((s, e) => s + Number(e?.amount || 0), 0), [expenses]);
  const totalCredited = useMemo(() => (Array.isArray(credits) ? credits : []).reduce((s, c) => s + Number(c?.amount || 0), 0), [credits]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    (Array.isArray(expenses) ? expenses : []).forEach(e => {
      if (!e) return;
      const amt = Number(e.amount);
      if (!isNaN(amt)) {
        const cat = e.category || 'Other';
        counts[cat] = (counts[cat] || 0) + amt;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);
  }, [expenses]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden relative">
            {loading && <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingDown className="h-4 w-4" /> Total Spent</div>
              <p className="text-2xl font-bold text-destructive mt-1">₹{totalSpent.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden relative">
            {loading && <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> Total Credited</div>
              <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalCredited.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden relative">
            {loading && <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="h-4 w-4" /> Balance</div>
              <p className={cn("text-2xl font-bold mt-1", totalCredited - totalSpent >= 0 ? "text-emerald-600" : "text-destructive")}>₹{(totalCredited - totalSpent).toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3 border-b border-border/10 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <TrendingDown className="h-5 w-5" /> {editExpenseId ? 'Edit Debit (Expense)' : 'Add Debit (Expense)'}
                </CardTitle>
                {editExpenseId && (
                  <Button variant="ghost" size="sm" onClick={() => { setEditExpenseId(null); setExpAmount(''); setExpDesc(''); }} className="h-8">
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                )}
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
                      <Input placeholder="Manual entry..." value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="border-border/50 h-8 text-xs flex-1" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Amount (₹)</label>
                    <Input type="number" placeholder="0.00" value={expAmount} onChange={e => setExpAmount(e.target.value)} className="border-border/50 h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Paid To</label>
                    <Input placeholder="e.g. Amazon" value={expPaidTo} onChange={e => setExpPaidTo(e.target.value)} className="border-border/50 h-8 text-xs" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Description</label>
                  <Input placeholder="Details..." value={expDesc} onChange={e => setExpDesc(e.target.value)} className="border-border/50 h-8 text-xs" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1">
                    <Input ref={fileInputRef} type="file" className="hidden" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full gap-2 text-xs border-dashed">
                      {receiptFile ? <><FileImage className="h-3 w-3" /> {receiptFile.name.slice(0, 10)}...</> : <><Upload className="h-3 w-3" /> Receipt</>}
                    </Button>
                  </div>
                  <Button onClick={handleAddExpense} size="sm" className="bg-destructive hover:bg-destructive/90 text-white gap-2 text-xs" disabled={!expAmount || !expDesc || uploading}>
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : (editExpenseId ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />)}
                    {editExpenseId ? 'Update Debit' : 'Add Debit'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3 border-b border-border/10 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-emerald-600">
                  <TrendingUp className="h-5 w-5" /> {editCreditId ? 'Edit Credit' : 'Add Credit'}
                </CardTitle>
                {editCreditId && (
                  <Button variant="ghost" size="sm" onClick={() => { setEditCreditId(null); setCredAmount(''); setCredGivenBy(''); }} className="h-8">
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                )}
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
                    <Input type="number" placeholder="0.00" value={credAmount} onChange={e => setCredAmount(e.target.value)} className="border-border/50 h-8 text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Given By</label>
                    <Input placeholder="Internal/CEO" value={credGivenBy} onChange={e => setCredGivenBy(e.target.value)} className="border-border/50 h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Role</label>
                    <Input placeholder="Title" value={credRole} onChange={e => setCredRole(e.target.value)} className="border-border/50 h-8 text-xs" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Description</label>
                  <Input placeholder="Optional notes..." value={credDesc} onChange={e => setCredDesc(e.target.value)} className="border-border/50 h-8 text-xs" />
                </div>
                <div className="pt-2 text-right">
                  <Button onClick={handleAddCredit} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs" disabled={!credAmount || !credGivenBy}>
                    {editCreditId ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {editCreditId ? 'Update Credit' : 'Add Credit'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] pt-4 relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
              ) : expenses.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={500}
                      animationDuration={1500}
                    >
                      {CATEGORIES.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* History Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
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
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading transactions...</TableCell></TableRow>
                    ) : (Array.isArray(expenses) && Array.isArray(credits) 
                        ? [...expenses.filter(e => e).map(e => ({ ...e, type: 'debit' })), ...credits.filter(c => c).map(c => ({ ...c, type: 'credit' }))] 
                        : []
                    ).sort((a, b) => new Date(b?.expense_date || b?.credit_date || 0).getTime() - new Date(a?.expense_date || a?.credit_date || 0).getTime()).map((item, idx) => (
                      <motion.tr
                        key={item._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-card/50 group hover:bg-muted/50 transition-colors border-b border-border/10"
                      >
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
                          <div className="flex items-center gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary hover:bg-primary/10" onClick={() => handleEditClick(item)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-500 hover:bg-red-50" onClick={() => item.type === 'debit' ? handleDeleteExpense(item._id) : handleDeleteCredit(item._id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

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
  const allTransactions = useMemo(() => [
    ...expenses.filter(e => e && e.user_id?._id !== user?.id).map(e => ({ ...e, type: 'expense' })),
    ...credits.filter(c => c && c.user_id?._id !== user?.id).map(c => ({ ...c, type: 'credit' })),
  ].sort((a, b) => new Date(b?.expense_date || b?.credit_date || 0).getTime() - new Date(a?.expense_date || a?.credit_date || 0).getTime()), [expenses, credits, user]);

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

      {/* All Employee Transactions with Edit & Delete */}
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
              {/* Date */}
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

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Amount (₹)</label>
                <Input type="number" placeholder="0.00" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="border-border/50 h-8 text-xs" />
              </div>

              {/* Category (for expense) or Given By / Role (for credit) */}
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

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Description</label>
                <Input placeholder="Details..." value={editDesc} onChange={e => setEditDesc(e.target.value)} className="border-border/50 h-8 text-xs" />
              </div>

              {/* Approval Status (expense only) */}
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

export default AdminExpenses;
