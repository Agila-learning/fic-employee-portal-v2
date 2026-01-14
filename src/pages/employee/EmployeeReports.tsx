import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, FileText, Sun, Moon, Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';

type Department = 'BDA' | 'HR' | 'Tech' | 'Ops' | 'Marketing' | 'Finance' | 'Other';

interface EmployeeReport {
  id: string;
  user_id: string;
  report_date: string;
  department: Department;
  morning_description: string | null;
  afternoon_description: string | null;
  created_at: string;
  updated_at: string;
}

const DEPARTMENTS: Department[] = ['BDA', 'HR', 'Tech', 'Ops', 'Marketing', 'Finance', 'Other'];

const EmployeeReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<EmployeeReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [department, setDepartment] = useState<Department>('BDA');
  const [morningDescription, setMorningDescription] = useState('');
  const [afternoonDescription, setAfternoonDescription] = useState('');
  const [existingReportId, setExistingReportId] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false });

      if (error) throw error;
      setReports((data || []) as EmployeeReport[]);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error fetching reports:', error);
      }
      toast.error('Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  // Load existing report when date changes
  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingReport = reports.find(r => r.report_date === dateStr);
    
    if (existingReport) {
      setExistingReportId(existingReport.id);
      setDepartment(existingReport.department);
      setMorningDescription(existingReport.morning_description || '');
      setAfternoonDescription(existingReport.afternoon_description || '');
    } else {
      setExistingReportId(null);
      setMorningDescription('');
      setAfternoonDescription('');
    }
  }, [selectedDate, reports]);

  const handleSubmit = async () => {
    if (!user) return;
    
    if (!morningDescription.trim() && !afternoonDescription.trim()) {
      toast.error('Please add at least one description');
      return;
    }

    setIsSaving(true);
    try {
      const reportData = {
        user_id: user.id,
        report_date: format(selectedDate, 'yyyy-MM-dd'),
        department,
        morning_description: morningDescription.trim() || null,
        afternoon_description: afternoonDescription.trim() || null,
      };

      if (existingReportId) {
        const { error } = await supabase
          .from('employee_reports')
          .update(reportData)
          .eq('id', existingReportId);

        if (error) throw error;
        toast.success('Report updated successfully');
      } else {
        const { error } = await supabase
          .from('employee_reports')
          .insert(reportData);

        if (error) throw error;
        toast.success('Report submitted successfully');
      }

      await fetchReports();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error saving report:', error);
      }
      toast.error(error.message || 'Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daily Reports</h1>
            <p className="text-muted-foreground">Submit your morning and afternoon work reports</p>
          </div>
          <Button variant="outline" onClick={fetchReports} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Report Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {existingReportId ? 'Edit Report' : 'Submit New Report'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label>Report Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Morning Report */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                Morning Report
              </Label>
              <Textarea
                value={morningDescription}
                onChange={(e) => setMorningDescription(e.target.value)}
                placeholder="Describe your morning work activities..."
                rows={4}
              />
            </div>

            {/* Afternoon Report */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-blue-500" />
                Afternoon Report
              </Label>
              <Textarea
                value={afternoonDescription}
                onChange={(e) => setAfternoonDescription(e.target.value)}
                placeholder="Describe your afternoon work activities..."
                rows={4}
              />
            </div>

            <Button onClick={handleSubmit} disabled={isSaving} className="w-full md:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : existingReportId ? 'Update Report' : 'Submit Report'}
            </Button>
          </CardContent>
        </Card>

        {/* Reports History */}
        <Card>
          <CardHeader>
            <CardTitle>My Report History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No reports submitted yet</div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Morning</TableHead>
                      <TableHead>Afternoon</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow 
                        key={report.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedDate(new Date(report.report_date))}
                      >
                        <TableCell className="font-medium">
                          {format(new Date(report.report_date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>{report.department}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {report.morning_description || '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {report.afternoon_description || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeReports;
