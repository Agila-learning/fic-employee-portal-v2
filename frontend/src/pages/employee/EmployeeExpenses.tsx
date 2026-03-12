import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { operationService } from '@/api/operationService';
import { leadService } from '@/api/leadService';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Download, IndianRupee, TrendingUp, TrendingDown, Wallet, Upload, FileImage, ExternalLink } from 'lucide-react';
import { cn, safeParseDate } from '@/lib/utils';
import { createWorkbook, setColumnWidths, applyHeaderStyle, downloadWorkbook, styleCell, defaultBorder } from '@/utils/excelExport';
import { toast } from 'sonner';

const CATEGORIES = [
  'Tea/Coffee', 'Snacks', 'Pooja Materials', 'Office Use Things',
  'Sanitary Products', 'Food', 'Transport', 'Travel',
  'Office Supplies', 'Courier Charges', 'Petrol', 'Marketing', 'Lead Generation', 'Others'
];

const ROLES = ['CEO', 'Manager', 'Employee', 'HR', 'Others'];

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#06b6d4', '#e11d48'];

const EmployeeExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [expDate, setExpDate] = useState<Date>(new Date());
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState('Tea/Coffee');
  const [customCategory, setCustomCategory] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [credDate, setCredDate] = useState<Date>(new Date());
  const [credAmount, setCredAmount] = useState('');
  const [credGivenBy, setCredGivenBy] = useState('');
  const [credRole, setCredRole] = useState('manager');
  const [customRole, setCustomRole] = useState('');
  const [credDesc, setCredDesc] = useState('');

  const fetchData = useCallback(async () => {
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
      toast.error('Failed to fetch expense data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        expense_date: format(expDate, 'yyyy-MM-dd'),
        amount: parseFloat(expAmount),
        description: expDesc,
        category: finalCategory,
        receipt_url: receiptPath || undefined,
      });
      toast.success('Expense submitted');
      fetchData();
      setExpAmount(''); setExpDesc(''); setReceiptFile(null); setCustomCategory('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast.error('Failed to submit expense');
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
      toast.error('Delete failed');
    }
  };

  const handleAddCredit = async () => {
    if (!credAmount || !credGivenBy) return;
    const finalRole = credRole === 'others' ? (customRole || 'Others') : credRole;
    try {
      await operationService.createCredit({
        credit_date: format(credDate, 'yyyy-MM-dd'),
        amount: parseFloat(credAmount),
        given_by: credGivenBy,
        given_by_role: finalRole,
        description: credDesc || undefined
      });
      toast.success('Credit added');
      fetchData();
      setCredAmount(''); setCredGivenBy(''); setCredDesc(''); setCustomRole('');
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
      toast.error('Delete failed');
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

  // (Remaining UI logic stays same but refactored for readability and premium feel)
  const { totalSpent, totalCredited, dailySpent, weeklySpent, monthlySpent, pieData } = useMemo(() => {
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    const safeCredits = Array.isArray(credits) ? credits : [];

    const tSpent = safeExpenses.reduce((s, e) => s + (Number(e?.amount) || 0), 0);
    const tCredited = safeCredits.reduce((s, c) => s + (Number(c?.amount) || 0), 0);

    const now = new Date();
    const wStart = startOfWeek(now, { weekStartsOn: 1 });
    const wEnd = endOfWeek(now, { weekStartsOn: 1 });
    const mStart = startOfMonth(now);
    const mEnd = endOfMonth(now);

    const getDaily = safeExpenses.filter(e => format(safeParseDate(e.expense_date), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd'))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    
    const getWeekly = safeExpenses.filter(e => isWithinInterval(safeParseDate(e.expense_date), { start: wStart, end: wEnd }))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const getMonthly = safeExpenses.filter(e => isWithinInterval(safeParseDate(e.expense_date), { start: mStart, end: mEnd }))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const counts: Record<string, number> = {};
    safeExpenses.forEach(e => {
      const cat = e?.category || 'Other';
      counts[cat] = (counts[cat] || 0) + (Number(e?.amount) || 0);
    });
    const pData = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);

    return { 
      totalSpent: tSpent, 
      totalCredited: tCredited, 
      dailySpent: getDaily, 
      weeklySpent: getWeekly, 
      monthlySpent: getMonthly,
      pieData: pData
    };
  }, [expenses, credits]);

  const statusBadge = (status: string) => {
    if (status === 'approved') return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400">Pending</Badge>;
  };

  const exportExcel = async () => {
    const wb = createWorkbook();

    // Summary sheet
    const ws1 = wb.addWorksheet('Summary');
    setColumnWidths(ws1, [25, 20]);
    const summaryData = [
      ['Expense Summary Report', ''],
      ['Generated:', format(new Date(), 'PPP')],
      ['', ''],
      ['Metric', 'Amount (₹)'],
      ['Total Spent', totalSpent],
      ['Total Credited', totalCredited],
      ['Balance Remaining', totalCredited - totalSpent],
      ['', ''],
      ['Daily Spent', dailySpent],
      ['Weekly Spent', weeklySpent],
      ['Monthly Spent', monthlySpent],
    ];
    summaryData.forEach(row => ws1.addRow(row));
    styleCell(ws1.getRow(1).getCell(1), { fontBold: true, fontSize: 16, fontColor: '1A5276' });
    applyHeaderStyle(ws1, 2, '1A5276', 4);
    const balance = totalCredited - totalSpent;
    styleCell(ws1.getRow(7).getCell(2), {
      fontBold: true,
      fontColor: balance >= 0 ? '27AE60' : 'E74C3C',
      fillColor: balance >= 0 ? 'D5F5E3' : 'FADBD8',
    });

    // Expenses sheet
    const ws2 = wb.addWorksheet('Expenses');
    const expHeaders = ['Date', 'Category', 'Description', 'Amount (₹)', 'Status'];
    setColumnWidths(ws2, [15, 18, 35, 15, 12]);
    ws2.addRow(expHeaders);
    applyHeaderStyle(ws2, 5, '1A5276');
    expenses.forEach((e, i) => {
      const row = ws2.addRow([format(parseISO(e.expense_date), 'dd-MMM-yyyy'), e.category, e.description, Number(e.amount), e.approval_status]);
      const status = e.approval_status;
      const statusColor = status === 'approved' ? 'D5F5E3' : status === 'rejected' ? 'FADBD8' : 'FEF9E7';
      for (let c = 1; c <= 5; c++) {
        styleCell(row.getCell(c), {
          fillColor: c === 5 ? statusColor : (i % 2 === 0 ? 'F8F9FA' : 'FFFFFF'),
          border: defaultBorder,
        });
      }
    });

    // Credits sheet
    const ws3 = wb.addWorksheet('Credits');
    const credHeaders = ['Date', 'Given By', 'Role', 'Description', 'Amount (₹)'];
    setColumnWidths(ws3, [15, 20, 12, 30, 15]);
    ws3.addRow(credHeaders);
    applyHeaderStyle(ws3, 5, '1A5276');
    credits.forEach((c, i) => {
      const row = ws3.addRow([c.credit_date ? format(safeParseDate(c.credit_date), 'dd-MMM-yyyy') : '—', c.given_by, c.given_by_role, c.description || '-', Number(c.amount)]);
      for (let col = 1; col <= 5; col++) {
        styleCell(row.getCell(col), {
          fillColor: i % 2 === 0 ? 'EBF5FB' : 'FFFFFF',
          border: defaultBorder,
        });
      }
    });

    await downloadWorkbook(wb, `My_Expenses_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <DashboardLayout requiredRole="employee">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Expense Tracker</h1>
          <p className="text-muted-foreground text-sm">Track your daily office expenses and credits</p>
        </div>
        <Button onClick={exportExcel} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Spent', val: totalSpent, color: 'text-destructive', icon: TrendingDown },
          { label: 'Total Credited', val: totalCredited, color: 'text-emerald-600', icon: TrendingUp },
          { label: 'Balance', val: totalCredited - totalSpent, color: totalCredited - totalSpent >= 0 ? "text-emerald-600" : "text-destructive", icon: Wallet },
          { label: 'Today', val: dailySpent, color: 'text-foreground', icon: IndianRupee, sub: `Week: ₹${weeklySpent.toLocaleString()}` }
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm relative overflow-hidden">
              {loading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground"><c.icon className="h-3 w-3" /> {c.label}</div>
                <p className={cn("text-xl font-bold mt-1", c.color)}>₹{c.val.toLocaleString()}</p>
                {c.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{c.sub}</p>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Tabs defaultValue="expenses" className="w-full">
            <TabsList className="grid w-full sm:w-[300px] grid-cols-2">
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="space-y-4 mt-6">
              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-border/10"><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Add Expense</CardTitle></CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase text-muted-foreground">Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal border-border/50 text-xs">
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {format(expDate, 'PPP')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={expDate} onSelect={(d) => d && setExpDate(d)} className="p-1" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase text-muted-foreground">Category</label>
                      <div className="flex gap-2">
                        <Select value={expCategory} onValueChange={setExpCategory}>
                          <SelectTrigger className="border-border/50 h-8 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input placeholder="Custom..." value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="border-border/50 h-8 text-xs flex-1" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase text-muted-foreground">Amount (₹)</label>
                      <Input type="number" placeholder="0.00" value={expAmount} onChange={e => setExpAmount(e.target.value)} className="border-border/50 h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase text-muted-foreground">Description</label>
                      <Input placeholder="What was it for?" value={expDesc} onChange={e => setExpDesc(e.target.value)} className="border-border/50 h-8 text-xs" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-end pt-2">
                    <div className="space-y-1 flex-1">
                      <label className="text-xs font-medium uppercase text-muted-foreground">Receipt (Optional)</label>
                      <div className="flex gap-2">
                        <Input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="border-border/50 h-8 text-xs flex-1 file:text-[10px] file:mr-2" />
                      </div>
                    </div>
                    <Button onClick={handleAddExpense} size="sm" className="gap-2 sm:w-auto w-full text-xs" disabled={!expAmount || !expDesc || uploading}>
                      {uploading ? <><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</> : <><Plus className="h-3 w-3" /> Submit</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/30"><TableHead className="w-8 text-center">S.No</TableHead><TableHead>Date</TableHead><TableHead>Details</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-8"></TableHead></TableRow></TableHeader>
                      <TableBody>
                        <AnimatePresence mode="popLayout">
                          {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/30" /></TableCell></TableRow>
                          ) : expenses.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">No expenses found</TableCell></TableRow>
                          ) : expenses.map((e, index) => (
                            <motion.tr
                              key={e._id || e.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="group border-b border-border/10"
                            >
                              <TableCell className="text-center text-[10px] text-muted-foreground">{index + 1}</TableCell>
                              <TableCell className="text-[10px] font-medium whitespace-nowrap">{e.expense_date ? format(safeParseDate(e.expense_date), 'dd MMM yyyy') : '—'}</TableCell>
                              <TableCell>
                                <div className="text-[10px] font-bold uppercase text-amber-600">{e.category}</div>
                                <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{e.description}</div>
                                {e.receipt_url && (
                                  <button onClick={() => handleViewReceipt(e.receipt_url!)} className="text-[9px] text-primary hover:underline flex items-center gap-1 mt-0.5">
                                    <FileImage className="h-2 w-2" /> View Receipt
                                  </button>
                                )}
                              </TableCell>
                              <TableCell>{statusBadge(e.approval_status)}</TableCell>
                              <TableCell className="text-right font-bold text-destructive text-[11px]">₹{Number(e.amount).toLocaleString()}</TableCell>
                              <TableCell>
                                {e.approval_status === 'pending' && (
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(e._id || e.id)} className="h-6 w-6 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3" /></Button>
                                )}
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="credits" className="space-y-4 mt-6">
              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-border/10"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" /> Add Credit Recd.</CardTitle></CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase text-muted-foreground">Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal border-border/50 text-xs">
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {format(credDate, 'PPP')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={credDate} onSelect={(d) => d && setCredDate(d)} className="p-1" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase text-muted-foreground">Given By</label>
                      <Input placeholder="Name/Source" value={credGivenBy} onChange={e => setCredGivenBy(e.target.value)} className="border-border/50 h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase text-muted-foreground">Role</label>
                      <div className="flex gap-2">
                        <Select value={credRole} onValueChange={setCredRole}>
                          <SelectTrigger className="border-border/50 h-8 text-xs w-[110px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLES.map(r => <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {credRole === 'others' && (
                          <Input placeholder="Typing..." value={customRole} onChange={e => setCustomRole(e.target.value)} className="border-border/50 h-8 text-xs flex-1" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase text-muted-foreground">Amount (₹)</label>
                      <Input type="number" placeholder="0.00" value={credAmount} onChange={e => setCredAmount(e.target.value)} className="border-border/50 h-8 text-xs" />
                    </div>
                    <Button onClick={handleAddCredit} size="sm" className="gap-2 text-xs h-8" disabled={!credAmount || !credGivenBy}>
                      <Plus className="h-3 w-3" /> Add Credit
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/30"><TableHead className="w-8 text-center">S.No</TableHead><TableHead>Date</TableHead><TableHead>From</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-8"></TableHead></TableRow></TableHeader>
                      <TableBody>
                        <AnimatePresence mode="popLayout">
                          {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/30" /></TableCell></TableRow>
                          ) : credits.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-xs">No credits recorded</TableCell></TableRow>
                          ) : credits.map((c, index) => (
                            <motion.tr
                              key={c._id || c.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="group border-b border-border/10"
                            >
                              <TableCell className="text-center text-[10px] text-muted-foreground">{index + 1}</TableCell>
                              <TableCell className="text-[10px] font-medium whitespace-nowrap">{c.credit_date ? format(safeParseDate(c.credit_date), 'dd MMM yyyy') : '—'}</TableCell>
                              <TableCell>
                                <div className="text-[10px] font-bold text-emerald-600 uppercase">{c.given_by}</div>
                                <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{c.description || '-'}</div>
                              </TableCell>
                              <TableCell className="text-right font-bold text-emerald-600 text-[11px]">₹{Number(c.amount).toLocaleString()}</TableCell>
                              <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeleteCredit(c._id || c.id)} className="h-6 w-6 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3" /></Button></TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                <TrendingDown className="h-4 w-4" /> Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] pt-4 relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
              ) : expenses.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {CATEGORIES.map((_, idx) => <Cell key={`c-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip 
                      formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Amount']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: 'none', fontSize: '10px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
    </DashboardLayout>
  );
};

export default EmployeeExpenses;
