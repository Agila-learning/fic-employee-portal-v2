import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay } from 'date-fns';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Download, RefreshCw, FileSpreadsheet, Users, Building2 } from 'lucide-react';
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
  employee_name?: string;
}

interface Profile {
  user_id: string;
  name: string;
}

const DEPARTMENTS: Department[] = ['BDA', 'HR', 'Tech', 'Ops', 'Marketing', 'Finance', 'Other'];

const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<EmployeeReport[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error fetching profiles:', error);
      }
    }
  };

  const fetchReports = async () => {
    if (!user || user.role !== 'admin') return;
    
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      let query = supabase
        .from('employee_reports')
        .select('*')
        .eq('report_date', dateStr)
        .order('created_at', { ascending: false });

      if (selectedDepartment !== 'all') {
        query = query.eq('department', selectedDepartment);
      }

      if (selectedEmployee !== 'all') {
        query = query.eq('user_id', selectedEmployee);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Enrich with employee names
      const enrichedReports = (data || []).map(report => ({
        ...report,
        employee_name: profiles.find(p => p.user_id === report.user_id)?.name || 'Unknown',
      })) as EmployeeReport[];

      setReports(enrichedReports);
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
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (profiles.length > 0) {
      fetchReports();
    }
  }, [user, selectedDate, selectedDepartment, selectedEmployee, profiles]);

  // Group reports by department
  const reportsByDepartment = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = reports.filter(r => r.department === dept);
    return acc;
  }, {} as Record<Department, EmployeeReport[]>);

  const exportToExcel = () => {
    if (reports.length === 0) {
      toast.error('No reports to export');
      return;
    }

    const exportData = reports.map(report => ({
      'Date': format(new Date(report.report_date), 'dd/MM/yyyy'),
      'Employee Name': report.employee_name,
      'Department': report.department,
      'Morning Report': report.morning_description || '-',
      'Afternoon Report': report.afternoon_description || '-',
      'Submitted At': format(new Date(report.created_at), 'dd/MM/yyyy HH:mm'),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reports');

    // Auto-size columns
    const colWidths = [
      { wch: 12 },
      { wch: 25 },
      { wch: 12 },
      { wch: 50 },
      { wch: 50 },
      { wch: 18 },
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `Daily_Reports_${format(selectedDate, 'yyyy-MM-dd')}.xlsx`);
    toast.success('Report exported successfully');
  };

  const totalReports = reports.length;
  const departmentsWithReports = DEPARTMENTS.filter(d => reportsByDepartment[d].length > 0).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Department Reports</h1>
            <p className="text-muted-foreground">Daily employee work reports by department</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchReports} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={exportToExcel} disabled={reports.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalReports}</p>
                  <p className="text-sm text-muted-foreground">Reports Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Building2 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{departmentsWithReports}</p>
                  <p className="text-sm text-muted-foreground">Active Departments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{new Set(reports.map(r => r.user_id)).size}</p>
                  <p className="text-sm text-muted-foreground">Employees Reported</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
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

              {/* Department Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reports for {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No reports found for this date
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Morning Report</TableHead>
                      <TableHead>Afternoon Report</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.employee_name}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {report.department}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <p className="text-sm whitespace-pre-wrap">
                            {report.morning_description || <span className="text-muted-foreground">-</span>}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <p className="text-sm whitespace-pre-wrap">
                            {report.afternoon_description || <span className="text-muted-foreground">-</span>}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(report.created_at), 'HH:mm')}
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

export default AdminReports;
