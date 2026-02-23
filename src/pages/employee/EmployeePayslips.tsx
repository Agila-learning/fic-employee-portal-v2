import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Eye, FileText } from 'lucide-react';
import PayslipTemplate from '@/components/payroll/PayslipTemplate';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EmployeePayslips = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [viewPayslip, setViewPayslip] = useState<any | null>(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('payslips')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (data) setPayslips(data);
    };
    fetch();
  }, [user]);

  const years = [...new Set(payslips.map(p => p.year))].sort((a, b) => b - a);
  if (!years.includes(parseInt(filterYear))) years.push(parseInt(filterYear));
  years.sort((a, b) => b - a);

  const filtered = payslips.filter(p => p.year === parseInt(filterYear));

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6" /> My Payslips
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

        <Card>
          <CardHeader>
            <CardTitle>Payslips - {filterYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No payslips available for {filterYear}</TableCell></TableRow>
                  ) : filtered.map((ps, idx) => (
                    <TableRow key={ps.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell><Badge variant="outline">{MONTHS[ps.month - 1]} {ps.year}</Badge></TableCell>
                      <TableCell>₹{Number(ps.gross_salary).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-red-600">₹{Number(ps.total_deductions).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="font-semibold text-emerald-600">₹{Number(ps.net_salary).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setViewPayslip(ps)} className="gap-1">
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
            <DialogTitle>Payslip</DialogTitle>
          </DialogHeader>
          {viewPayslip && <PayslipTemplate payslip={viewPayslip} />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EmployeePayslips;
