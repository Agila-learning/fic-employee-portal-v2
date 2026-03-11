import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { badgeVariants, Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/contexts/AuthContext';
import { operationService } from '@/api/operationService';
import { leadService } from '@/api/leadService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarIcon, TrendingDown, TrendingUp, Wallet, Plus, Trash2, Upload, FileImage, BarChart3, Loader2, Pencil, X } from 'lucide-react';
import { cn, safeParseDate } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CATEGORIES, PIE_COLORS } from './AdminExpenses';

const AdminMyExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    const payload: any = {
      expense_date: format(expDate, 'yyyy-MM-dd'), amount: parseFloat(expAmount),
      description: expDesc, category: finalCategory, approval_status: 'approved',
      paid_to: expPaidTo || null,
    };
    if (receiptPath) payload.receipt_url = receiptPath;

    try {
      if (editExpenseId) {
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
                    ).sort((a, b: any) => new Date(b?.expense_date || b?.credit_date || 0).getTime() - new Date(a?.expense_date || a?.credit_date || 0).getTime()).map((item, idx) => (
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

export default AdminMyExpenses;
