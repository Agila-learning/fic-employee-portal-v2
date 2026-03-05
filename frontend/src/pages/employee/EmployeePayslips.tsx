import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { operationService } from '@/api/operationService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, FileText } from 'lucide-react';
import PayslipTemplate from '@/components/payroll/PayslipTemplate';
import { toast } from 'sonner';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EmployeePayslips = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [viewPayslip, setViewPayslip] = useState<any | null>(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await operationService.getMyPayslips();
        setPayslips(data || []);
      } catch (error) {
        toast.error('Failed to fetch payslips');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const years = [...new Set(payslips.map(p => p.year))].sort((a, b) => b - a);
  const currentYearNum = parseInt(filterYear);
  if (!years.includes(currentYearNum)) years.push(currentYearNum);
  years.sort((a, b) => b - a);

  const filtered = payslips.filter(p => p.year === currentYearNum);

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2 font-heading">
              <FileText className="h-6 w-6 text-primary" /> My Payslips
            </h1>
            <p className="text-sm text-muted-foreground">View and download your monthly salary slips</p>
          </div>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg">Payslips - {filterYear}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-16 text-center">S.No</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Loading payslips...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No payslips available for {filterYear}</TableCell></TableRow>
                  ) : filtered.map((ps, idx) => (
                    <TableRow key={ps._id || ps.id}>
                      <TableCell className="text-center font-medium text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-primary/5">{MONTHS[ps.month - 1]} {ps.year}</Badge></TableCell>
                      <TableCell className="font-medium">₹{Number(ps.gross_salary || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-destructive">₹{Number(ps.total_deductions || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="font-bold text-emerald-600">₹{Number(ps.net_salary || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setViewPayslip(ps)} className="gap-2 hover:bg-primary/10 hover:text-primary transition-colors">
                          <Eye className="h-4 w-4" /> View & Download
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

      <Dialog open={!!viewPayslip} onOpenChange={() => setViewPayslip(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Monthly Payslip Details
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {viewPayslip && <PayslipTemplate payslip={viewPayslip} />}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EmployeePayslips;
