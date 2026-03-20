import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { employeeService } from '@/api/employeeService';
import { reportService } from '@/api/reportService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { createWorkbook, setColumnWidths, addDataRows, downloadWorkbook } from '@/utils/excelExport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarIcon, Download, RefreshCw, FileSpreadsheet, Users, Building2, User, Phone, MapPin, Briefcase, MessageSquare, Sun, Moon, Trash2 } from 'lucide-react';
import { cn, safeParseDate } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

type Department = 'BDA' | 'HR' | 'Tech' | 'Ops' | 'Marketing' | 'Finance' | 'Other';

interface EmployeeReport {
  id: string;
  user_id: string;
  report_date: string;
  department: Department;
  morning_description: string | null;
  afternoon_description: string | null;
  candidates_screened: number | null;
  created_at: string;
  updated_at: string;
  employee_name?: string;
}

interface CandidateEntry {
  id: string;
  candidate_name: string;
  mobile_number: string;
  domain: string;
  agent_name: string | null;
  location: string | null;
  comments: string | null;
}

const DEPARTMENTS: Department[] = ['BDA', 'HR', 'Tech', 'Ops', 'Marketing', 'Finance', 'Other'];

const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<EmployeeReport[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<EmployeeReport | null>(null);
  const [viewCandidates, setViewCandidates] = useState<CandidateEntry[]>([]);

  // Filters
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const fetchProfiles = useCallback(async () => {
    try {
      const data = await employeeService.getEmployees();
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const data = await reportService.getReports();

      // Enrich with employee names and departments
      const enrichedReports = (data || []).map((r: any) => {
        const profile = profiles.find(p => {
          const userId = r.user_id?._id || r.user_id;
          return userId === p.user_id || userId === (p as any)._id;
        });
        const rawDept = r.department || (typeof r.user_id === 'object' ? r.user_id.department : profile?.department) || '-';
        const matchedDept = DEPARTMENTS.find(d => d.toLowerCase() === rawDept.toLowerCase());

        return {
          ...r,
          employee_name: r.user_id?.name || profile?.name || 'Unknown',
          department: matchedDept || rawDept
        };
      }) as EmployeeReport[];

      setReports(enrichedReports);
    } catch (error: any) {
      toast.error('Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedDate, selectedDepartment, selectedEmployee, profiles]);

  const fetchCandidateEntries = async (reportId: string, reportDate: string, userId: string) => {
    try {
      const data = await (employeeService as any).getCandidateEntries(userId, reportDate);
      return (data || []) as CandidateEntry[];
    } catch (error: any) {
      return [];
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    if (profiles.length > 0) {
      fetchReports();
    }
  }, [fetchReports, profiles]);

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    try {
      await reportService.deleteReport(id);
      toast.success('Report deleted');
      fetchReports();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete report');
    }
  };

  const handleViewReport = async (report: EmployeeReport) => {
    setSelectedReport(report);
    if (report.department === 'BDA' || report.department === 'HR') {
      const entries = await fetchCandidateEntries(report.id, report.report_date, report.user_id);
      setViewCandidates(entries);
    } else {
      setViewCandidates([]);
    }
  };

  // Apply frontend filters
  const filteredReports = reports.filter(r => {
    // Date filter
    if (selectedDate) {
      const reportDate = new Date(r.report_date);
      const selected = new Date(selectedDate);
      if (
        reportDate.getFullYear() !== selected.getFullYear() ||
        reportDate.getMonth() !== selected.getMonth() ||
        reportDate.getDate() !== selected.getDate()
      ) return false;
    }
    // Department filter
    if (selectedDepartment !== 'all' && r.department !== selectedDepartment) return false;
    // Employee filter
    if (selectedEmployee !== 'all') {
      const userId = typeof r.user_id === 'object' ? (r.user_id as any)?._id || (r.user_id as any) : r.user_id;
      if (userId !== selectedEmployee) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime());

  // Group reports by department
  const reportsByDepartment = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = reports.filter(r => r.department === dept);
    return acc;
  }, {} as Record<Department, EmployeeReport[]>);

  // Calculate total candidates screened for HR
  const totalCandidatesScreened = reports
    .filter(r => r.department === 'HR' && r.candidates_screened)
    .reduce((sum, r) => sum + (r.candidates_screened || 0), 0);

  const exportToExcel = async () => {
    if (reports.length === 0) {
      toast.error('No reports to export');
      return;
    }

    // Fetch all candidate entries for BDA/HR reports
    const bdaHrReports = reports.filter(r => r.department === 'BDA' || r.department === 'HR');
    const allCandidateEntries: { report: EmployeeReport; entries: CandidateEntry[] }[] = [];

    for (const report of bdaHrReports) {
      const entries = await fetchCandidateEntries(report.id, report.report_date, report.user_id);
      allCandidateEntries.push({ report, entries });
    }

    // Main reports sheet
    const mainExportData = reports.map(report => ({
      'Date': format(safeParseDate(report.report_date), 'dd/MM/yyyy'),
      'Employee Name': report.employee_name,
      'Department': report.department,
      'Morning Report': report.morning_description || '-',
      'Afternoon Report': report.afternoon_description || '-',
      'Candidates Screened (HR)': report.candidates_screened ?? '-',
      'Submitted At': format(safeParseDate(report.created_at), 'dd/MM/yyyy HH:mm'),
      'Last Updated': format(safeParseDate(report.updated_at), 'dd/MM/yyyy HH:mm'),
    }));

    // Candidate entries sheet (for BDA/HR)
    const candidateExportData: any[] = [];
    for (const { report, entries } of allCandidateEntries) {
      for (const entry of entries) {
        candidateExportData.push({
          'Date': format(safeParseDate(report.report_date), 'dd/MM/yyyy'),
          'Employee Name': report.employee_name,
          'Department': report.department,
          'Candidate Name': entry.candidate_name,
          'Mobile Number': entry.mobile_number,
          'Domain': entry.domain,
          'Agent Name': entry.agent_name || '-',
          'Location': entry.location || '-',
          'Comments': entry.comments || '-',
        });
      }
    }

    const wb = createWorkbook();

    // Main reports sheet
    const ws1 = wb.addWorksheet('Reports');
    const reportHeaders = ['Date', 'Employee Name', 'Department', 'Morning Report', 'Afternoon Report', 'Candidates Screened (HR)', 'Submitted At', 'Last Updated'];
    setColumnWidths(ws1, [12, 25, 12, 50, 50, 20, 18, 18]);
    addDataRows(ws1, reportHeaders, mainExportData.map(r => Object.values(r)));

    // Candidate entries sheet
    if (candidateExportData.length > 0) {
      const ws2 = wb.addWorksheet('BDA-HR Candidates');
      const candHeaders = ['Date', 'Employee Name', 'Department', 'Candidate Name', 'Mobile Number', 'Domain', 'Agent Name', 'Location', 'Comments'];
      setColumnWidths(ws2, [12, 25, 12, 25, 15, 15, 25, 20, 40]);
      addDataRows(ws2, candHeaders, candidateExportData.map(r => Object.values(r)));
    }

    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    const dateLabel = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'all-dates';
    await downloadWorkbook(wb, `Daily_Reports_${dateLabel}_exported_${timestamp}.xlsx`);
    toast.success('Report exported successfully');
  };

  const clearFilters = () => {
    setSelectedDate(undefined);
    setSelectedDepartment('all');
    setSelectedEmployee('all');
  };

  const totalReports = reports.length;
  const departmentsWithReports = DEPARTMENTS.filter(d => reportsByDepartment[d].length > 0).length;
  const bdaHrReports = reports.filter(r => r.department === 'BDA' || r.department === 'HR').length;

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{totalReports}</p>
                  <p className="text-xs text-muted-foreground truncate">Total Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10">
                  <Building2 className="h-6 w-6 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{departmentsWithReports}</p>
                  <p className="text-xs text-muted-foreground truncate">Departments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{bdaHrReports}</p>
                  <p className="text-xs text-muted-foreground truncate">BDA/HR Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                  <User className="h-6 w-6 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{totalCandidatesScreened}</p>
                  <p className="text-xs text-muted-foreground truncate">Screened (HR)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
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
                      {selectedDate ? format(selectedDate, 'PPP') : 'All Dates'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
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
                      <SelectItem key={profile.user_id || profile._id} value={profile.user_id || profile._id}>
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
            <CardTitle>
              Reports {selectedDate ? `for ${format(selectedDate, 'MMMM d, yyyy')}` : '(All Dates)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No reports found for the selected filters
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">S.No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Morning Report</TableHead>
                      <TableHead>Afternoon Report</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report, index) => {
                      const isBDAorHR = report.department === 'BDA' || report.department === 'HR';

                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {format(safeParseDate(report.report_date), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="font-medium">{report.employee_name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                isBDAorHR && "bg-primary/10 text-primary border-primary/20"
                              )}
                            >
                              {report.department}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] align-top py-4">
                            {!report.morning_description ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <ol className="list-decimal pl-4 text-xs space-y-1 text-muted-foreground">
                                {(report.morning_description || '').split(/(?:\r?\n|(?<=[.?!])\s+(?=[A-Z0-9]))/).filter(Boolean).map((line, i) => {
                                  // Clean up existing numbering if present at start (e.g. "1. ", "1) ")
                                  const cleanedLine = line.trim().replace(/^\d+[\.\)\-\s]+/, '');
                                  return cleanedLine ? <li key={i}>{cleanedLine}</li> : null;
                                })}
                              </ol>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] align-top py-4">
                            {!report.afternoon_description ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <ol className="list-decimal pl-4 text-xs space-y-1 text-muted-foreground">
                                {(report.afternoon_description || '').split(/(?:\r?\n|(?<=[.?!])\s+(?=[A-Z0-9]))/).filter(Boolean).map((line, i) => {
                                  // Clean up existing numbering if present at start
                                  const cleanedLine = line.trim().replace(/^\d+[\.\)\-\s]+/, '');
                                  return cleanedLine ? <li key={i}>{cleanedLine}</li> : null;
                                })}
                              </ol>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewReport(report)}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteReport(report.id || (report as any)._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Report Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Report Details
              </DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 p-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> Employee
                      </p>
                      <p className="font-medium">{selectedReport.employee_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" /> Date
                      </p>
                      <p className="font-medium">{format(safeParseDate(selectedReport.report_date), 'dd MMM yyyy')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Department</p>
                      <Badge>{selectedReport.department}</Badge>
                    </div>
                    {selectedReport.department === 'HR' && selectedReport.candidates_screened && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Candidates Screened</p>
                        <Badge variant="secondary">{selectedReport.candidates_screened}</Badge>
                      </div>
                    )}
                  </div>

                  {/* Candidate Entries for BDA/HR */}
                  {(selectedReport.department === 'BDA' || selectedReport.department === 'HR') && viewCandidates.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 text-sm text-muted-foreground">
                        Candidate Entries ({viewCandidates.length})
                      </h4>
                      <div className="space-y-2">
                        {viewCandidates.map((entry, index) => (
                          <Card key={entry.id || index} className="p-3 bg-muted/50">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" /> Candidate
                                </span>
                                <span className="font-medium">{entry.candidate_name}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> Mobile
                                </span>
                                <span className="font-medium">{entry.mobile_number}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" /> Domain
                                </span>
                                <Badge variant="outline">{entry.domain}</Badge>
                              </div>
                              {entry.agent_name && (
                                <div>
                                  <span className="text-muted-foreground">Agent</span>
                                  <p>{entry.agent_name}</p>
                                </div>
                              )}
                              {entry.location && (
                                <div>
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> Location
                                  </span>
                                  <p>{entry.location}</p>
                                </div>
                              )}
                              {entry.comments && (
                                <div className="col-span-full">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" /> Comments
                                  </span>
                                  <p>{entry.comments}</p>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedReport.department === 'BDA' || selectedReport.department === 'HR') && viewCandidates.length === 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No candidate entries found for this report.
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                        <Sun className="h-4 w-4 text-amber-500" />
                        Morning Report
                      </h4>
                      <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedReport.morning_description || 'No morning report submitted.'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                        <Moon className="h-4 w-4 text-blue-500" />
                        Afternoon Report
                      </h4>
                      <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedReport.afternoon_description || 'No afternoon report submitted.'}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
