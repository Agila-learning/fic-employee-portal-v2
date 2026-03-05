import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [credDesc, setCredDesc] = useState('');

  const fetchData = useCallback(async () => {
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
    try {
      await operationService.createCredit({
        credit_date: format(credDate, 'yyyy-MM-dd'),
        amount: parseFloat(credAmount),
        given_by: credGivenBy,
        given_by_role: credRole,
        description: credDesc || undefined
      });
      toast.success('Credit added');
      fetchData();
      setCredAmount(''); setCredGivenBy(''); setCredDesc('');
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
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const filterByRange = (items: any[], range: 'daily' | 'weekly' | 'monthly') => {
    return items.filter(item => {
      const d = parseISO(item.expense_date || item.credit_date);
      if (range === 'daily') return format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      if (range === 'weekly') return isWithinInterval(d, { start: weekStart, end: weekEnd });
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
  };

  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalCredited = credits.reduce((s, c) => s + Number(c.amount), 0);
  const dailySpent = filterByRange(expenses, 'daily').reduce((s, e) => s + Number(e.amount), 0);
  const weeklySpent = filterByRange(expenses, 'weekly').reduce((s, e) => s + Number(e.amount), 0);
  const monthlySpent = filterByRange(expenses, 'monthly').reduce((s, e) => s + Number(e.amount), 0);

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
      <div className="space-y-6">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-scale-in">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm"><CardContent className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingDown className="h-4 w-4" /> Total Spent</div><p className="text-2xl font-bold text-destructive mt-1">₹{totalSpent.toLocaleString()}</p></CardContent></Card>
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm"><CardContent className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> Total Credited</div><p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalCredited.toLocaleString()}</p></CardContent></Card>
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm"><CardContent className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="h-4 w-4" /> Balance</div><p className={cn("text-2xl font-bold mt-1", totalCredited - totalSpent >= 0 ? "text-emerald-600" : "text-destructive")}>₹{(totalCredited - totalSpent).toLocaleString()}</p></CardContent></Card>
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm"><CardContent className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><IndianRupee className="h-4 w-4" /> Today</div><p className="text-2xl font-bold mt-1">₹{dailySpent.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Week: ₹{weeklySpent.toLocaleString()} · Month: ₹{monthlySpent.toLocaleString()}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="credits">Credits Received</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4 mt-6">
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader><CardTitle className="text-base">Add Expense</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal border-border/50">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(expDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={expDate} onSelect={(d) => d && setExpDate(d)} className="p-3" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Category</label>
                    <div className="flex gap-2">
                      <Select value={expCategory} onValueChange={setExpCategory}>
                        <SelectTrigger className="border-border/50 w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Manual entry..." value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="border-border/50 flex-1" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Amount (₹)</label>
                    <Input type="number" placeholder="0.00" value={expAmount} onChange={e => setExpAmount(e.target.value)} className="border-border/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Description</label>
                    <Input placeholder="What was it for?" value={expDesc} onChange={e => setExpDesc(e.target.value)} className="border-border/50" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="space-y-1 flex-1">
                    <label className="text-sm font-medium">Receipt (optional)</label>
                    <div className="flex gap-2">
                      <Input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="border-border/50 flex-1" />
                      {receiptFile && <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0"><FileImage className="h-3 w-3" /> {receiptFile.name.slice(0, 15)}...</span>}
                    </div>
                  </div>
                  <Button onClick={handleAddExpense} className="gap-2 sm:w-auto w-full" disabled={!expAmount || !expDesc || uploading}>
                    {uploading ? <><Upload className="h-4 w-4 animate-spin" /> Uploading...</> : <><Plus className="h-4 w-4" /> Submit Expense</>}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-12 text-center">S.No</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Loading expenses...</TableCell></TableRow>
                      ) : expenses.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No expenses recorded yet</TableCell></TableRow>
                      ) : expenses.map((e, index) => (
                        <TableRow key={e._id || e.id}>
                          <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium whitespace-nowrap">{e.expense_date ? format(safeParseDate(e.expense_date), 'dd MMM yyyy') : '—'}</TableCell>
                          <TableCell><Badge variant="outline" className="bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-emerald-400 capitalize">{e.category}</Badge></TableCell>
                          <TableCell className="max-w-[200px] truncate">{e.description}</TableCell>
                          <TableCell>
                            {e.receipt_url ? (
                              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 hover:bg-primary/10 hover:text-primary" onClick={() => handleViewReceipt(e.receipt_url!)}>
                                <ExternalLink className="h-3 w-3" /> View
                              </Button>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>{statusBadge(e.approval_status)}</TableCell>
                          <TableCell className="text-right font-bold text-destructive">₹{Number(e.amount).toLocaleString()}</TableCell>
                          <TableCell>
                            {e.approval_status === 'pending' && (
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(e._id || e.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits" className="space-y-4 mt-6">
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader><CardTitle className="text-base">Add Credit Received</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal border-border/50">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(credDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={credDate} onSelect={(d) => d && setCredDate(d)} className="p-3" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Given By</label>
                    <Input placeholder="Name" value={credGivenBy} onChange={e => setCredGivenBy(e.target.value)} className="border-border/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={credRole} onValueChange={setCredRole}>
                      <SelectTrigger className="border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="ceo">CEO</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Amount (₹)</label>
                    <Input type="number" placeholder="0.00" value={credAmount} onChange={e => setCredAmount(e.target.value)} className="border-border/50" />
                  </div>
                  <Button onClick={handleAddCredit} className="gap-2" disabled={!credAmount || !credGivenBy}>
                    <Plus className="h-4 w-4" /> Add Credit
                  </Button>
                </div>
                <Input placeholder="Description (optional)" value={credDesc} onChange={e => setCredDesc(e.target.value)} className="border-border/50" />
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-12 text-center">S.No</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Given By</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {credits.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No credits recorded yet</TableCell></TableRow>
                      ) : credits.map((c, index) => (
                        <TableRow key={c._id || c.id}>
                          <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium whitespace-nowrap">{c.credit_date ? format(safeParseDate(c.credit_date), 'dd MMM yyyy') : '—'}</TableCell>
                          <TableCell className="font-medium">{c.given_by || 'Company'}</TableCell>
                          <TableCell><Badge variant="outline" className="bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 capitalize">{c.given_by_role}</Badge></TableCell>
                          <TableCell className="max-w-[200px] truncate">{c.description || '-'}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">₹{Number(c.amount).toLocaleString()}</TableCell>
                          <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeleteCredit(c._id || c.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></Button></TableCell>
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
    </DashboardLayout>
  );
};

export default EmployeeExpenses;
