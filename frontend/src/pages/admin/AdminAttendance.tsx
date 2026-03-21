import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAttendance, Attendance } from '@/hooks/useAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { useHolidays } from '@/hooks/useHolidays';
import { operationService } from '@/api/operationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarCheck, CheckCircle, XCircle, Search, Download, FileText, Pencil, UserPlus, Clock, MapPin, Calendar as CalendarIcon, Filter, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import AttendanceEditDialog from '@/components/attendance/AttendanceEditDialog';
import AdminMarkAttendanceDialog from '@/components/attendance/AdminMarkAttendanceDialog';
import HolidayManagement from '@/components/admin/HolidayManagement';
import EmployeeAttendanceExport from '@/components/attendance/EmployeeAttendanceExport';
import AttendanceMapView from '@/components/attendance/AttendanceMapView';
import LocationTrendReport from '@/components/attendance/LocationTrendReport';
import { getLocationDisplayName } from '@/utils/geolocation';
import { createWorkbook, setColumnWidths, applyHeaderStyle, applyRowStyles, downloadWorkbook, styleCell, defaultBorder, solidBorder } from '@/utils/excelExport';

const AdminAttendance = () => {
  const { attendance, updateAttendance, adminMarkAttendance } = useAttendance();
  const { employees } = useEmployees();
  const { holidays } = useHolidays();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'half_day' | 'absent'>('all');
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const [exportFromDate, setExportFromDate] = useState<Date | undefined>(undefined);
  const [exportToDate, setExportToDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  const fetchAttendance = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const filters: any = {};
      if (periodFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        filters.startDate = todayStr;
        filters.endDate = todayStr;
      } else if (periodFilter === 'week') {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
        const end = endOfWeek(new Date(), { weekStartsOn: 1 });
        filters.startDate = format(start, 'yyyy-MM-dd');
        filters.endDate = format(end, 'yyyy-MM-dd');
      } else if (periodFilter === 'month') {
        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());
        filters.startDate = format(start, 'yyyy-MM-dd');
        filters.endDate = format(end, 'yyyy-MM-dd');
      } else if (periodFilter === 'custom') {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }

      const data = await operationService.getAllAttendance(filters);
      setAttendanceRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch attendance records', variant: 'destructive' });
      setAttendanceRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, [periodFilter, startDate, endDate, toast]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const filteredAttendance = attendanceRecords.filter(a => {
    if (!a) return false;
    // Exclude admin users from attendance display
    const uid = (a.user_id && typeof a.user_id === 'object') ? (a.user_id as any)._id : a.user_id;
    const emp = employees.find(e => e && e.user_id === uid);
    if (emp && emp.role === 'admin') return false;

    const userName = (a.user_id && typeof a.user_id === 'object' ? (a.user_id as any).name : a.user_name) || 'Unknown';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'present') matchesStatus = a.status === 'present' && !a.half_day;
    else if (statusFilter === 'half_day') matchesStatus = a.half_day === true;
    else if (statusFilter === 'absent') matchesStatus = a.status === 'absent';

    return matchesSearch && matchesStatus;
  });

  const getSummary = () => {
    const totalEmployees = employees.filter(e => e && e.role !== 'admin' && e.is_active !== false).length;
    
    // For summary, if it's a multi-day range, we might need average or per-day breakdown
    // But for the requested "traceability", let's show totals for the selected period
    const safeFilteredAttendance = Array.isArray(filteredAttendance) ? filteredAttendance.filter(a => a) : [];
    
    let present = 0, halfDay = 0, absent = 0;
    
    safeFilteredAttendance.forEach(a => {
      const isSun = new Date(a.date).getDay() === 0;
      if (isSun) {
        present++;
      } else if (a.half_day) {
        halfDay++;
      } else if (a.status === 'present') {
        present++;
      } else {
        absent++;
      }
    });

    return { totalEmployees, present, halfDay, absent };
  };

  const summary = getSummary();

  const getStatusBadge = (record: Attendance) => {
    const isSun = new Date(record.date).getDay() === 0;
    if (isSun) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <CalendarIcon className="h-3 w-3" />
          Sunday
        </span>
      );
    }
    if (record.half_day) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3" />
          Half Day
        </span>
      );
    }
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        record.status === 'present'
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
      )}>
        {record.status === 'present' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {record.status}
      </span>
    );
  };

  const exportToExcel = async () => {
    if (attendanceRecords.length === 0) {
      toast({ title: 'No Data', description: 'No attendance records to export', variant: 'destructive' });
      return;
    }

    const wb = createWorkbook();

    // ===== SHEET 1: Employee Summary =====
    const empMap: Record<string, { name: string; present: number; halfDay: number; absent: number; totalDays: number }> = {};
    const safeAttendanceRecords = Array.isArray(attendanceRecords) ? attendanceRecords : [];
    safeAttendanceRecords.forEach(record => {
      if (!record) return;
      const name = (record.user_id && typeof record.user_id === 'object' ? (record.user_id as any).name : record.user_name) || 'Unknown';
      const uid = (record.user_id && typeof record.user_id === 'object') ? (record.user_id as any)._id : record.user_id?.toString() || 'unknown';
      
      if (!empMap[uid]) {
        empMap[uid] = { name, present: 0, halfDay: 0, absent: 0, totalDays: 0 };
      }
      empMap[uid].totalDays++;
      
      const isSun = new Date(record.date).getDay() === 0;
      if (isSun) {
        empMap[uid].present++;
      } else if (record.half_day) {
        empMap[uid].halfDay++;
      } else if (record.status === 'present') {
        empMap[uid].present++;
      } else {
        empMap[uid].absent++;
      }
    });

    const summaryRows = Object.values(empMap).map(e => {
      const effectivePresent = e.present + (e.halfDay * 0.5);
      const pct = e.totalDays > 0 ? Math.round((effectivePresent / e.totalDays) * 100) : 0;
      return [e.name, e.totalDays, e.present, e.halfDay, e.absent, effectivePresent, `${pct}%`];
    });

    const summarySheet = wb.addWorksheet('Employee Summary');
    const summaryHeaders = ['Employee Name', 'Total Days', 'Present Days', 'Half Days', 'Absent Days', 'Effective Present', 'Attendance %'];
    setColumnWidths(summarySheet, [25, 12, 14, 12, 13, 16, 14]);
    summarySheet.addRow(summaryHeaders);
    applyHeaderStyle(summarySheet, 7, '2E86C1');
    summaryRows.forEach((row, idx) => {
      const dataRow = summarySheet.addRow(row);
      const pctStr = row[6] as string;
      const pct = parseInt(pctStr);
      const bgColor = pct >= 80 ? 'D5F5E3' : pct >= 60 ? 'FEF9E7' : 'FADBD8';
      for (let c = 1; c <= 7; c++) {
        const cell = dataRow.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bgColor}` } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = defaultBorder;
      }
    });

    // ===== SHEET 2: All Records (Grouped by Date) =====
    const mapRecord = (record: Attendance) => {
      const name = (record.user_id && typeof record.user_id === 'object' ? (record.user_id as any).name : record.user_name) || 'Unknown';
      const isSun = new Date(record.date).getDay() === 0;
      return {
        'Employee Name': name,
        'Date': record.date,
        'Day': record.date ? new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }) : '-',
        'Status': isSun ? 'Sunday' : (record.half_day ? 'Half Day' : (record.status === 'present' ? 'Present' : 'Absent')),
        'Work Location': getLocationDisplayName(record.work_location),
        'Marked At': record.marked_at ? new Date(record.marked_at).toLocaleTimeString() : '-',
        'Leave Reason': isSun ? '-' : (record.status === 'absent' ? (record.leave_reason || record.notes || '-') : '-'),
        'Location Verified': record.location_verified ? 'Yes' : 'No'
      };
    };

    const colWidths = [25, 14, 12, 12, 20, 14, 40, 16];
    const cols = ['Employee Name', 'Date', 'Day', 'Status', 'Work Location', 'Marked At', 'Leave Reason', 'Location Verified'];

    const allSheet = wb.addWorksheet('All Records');
    setColumnWidths(allSheet, colWidths);
    allSheet.addRow(cols);
    applyHeaderStyle(allSheet, 8, '1A5276');

    const sortedData = [...safeAttendanceRecords].filter(a => a).sort((a, b) => (a?.date || '').localeCompare(b?.date || ''));
    const dateGroups: Record<string, Attendance[]> = {};
    sortedData.forEach(record => {
      if (!record) return;
      const d = record.date || 'Unknown';
      if (!dateGroups[d]) dateGroups[d] = [];
      dateGroups[d].push(record);
    });

    const sortedDates = Object.keys(dateGroups).sort();
    sortedDates.forEach((date, dateIdx) => {
      if (dateIdx > 0) allSheet.addRow([]);
      const dayName = date !== 'Unknown' ? new Date(date).toLocaleDateString('en-US', { weekday: 'long' }) : '-';
      const dateLabel = `📅  ${date}  —  ${dayName}  (${dateGroups[date].length} employees)`;
      const dateRow = allSheet.addRow([dateLabel]);
      allSheet.mergeCells(dateRow.number, 1, dateRow.number, 8);
      for (let c = 1; c <= 8; c++) {
        styleCell(dateRow.getCell(c), {
          fillColor: '1B4F72', fontBold: true, fontColor: 'FFFFFF', fontSize: 12,
          horizontal: 'left', vertical: 'middle', border: solidBorder,
        });
      }

      dateGroups[date].forEach(record => {
        const mapped = mapRecord(record);
        const row = allSheet.addRow(cols.map(c => mapped[c as keyof typeof mapped]));
        let bgColor = 'FFFFFF';
        if (mapped['Status'] === 'Present' || mapped['Status'] === 'Sunday') bgColor = 'D5F5E3';
        else if (mapped['Status'] === 'Half Day') bgColor = 'FEF9E7';
        else if (mapped['Status'] === 'Absent') bgColor = 'FADBD8';
        for (let c = 1; c <= 8; c++) {
          styleCell(row.getCell(c), { fillColor: bgColor, horizontal: 'center', vertical: 'middle', border: defaultBorder });
        }
      });
    });

    await downloadWorkbook(wb, `attendance_report_${periodFilter}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    toast({ title: 'Success', description: 'Attendance report exported' });
  };

  const getMonthlyStats = () => {
    const employeeStats: { [key: string]: { name: string; present: number; halfDay: number; absent: number } } = {};
    const safeAttendanceRecords = Array.isArray(attendanceRecords) ? attendanceRecords : [];

    safeAttendanceRecords.forEach(record => {
      if (!record) return;
      const name = (record.user_id && typeof record.user_id === 'object' ? (record.user_id as any).name : record.user_name) || 'Unknown';
      const uid = (record.user_id && typeof record.user_id === 'object') ? (record.user_id as any)._id : record.user_id?.toString() || 'unknown';
      if (!uid) return;
      if (!employeeStats[uid]) {
        employeeStats[uid] = { name, present: 0, halfDay: 0, absent: 0 };
      }
      
      const isSun = new Date(record.date).getDay() === 0;
      if (isSun) {
        employeeStats[uid].present++;
      } else if (record.half_day) {
        employeeStats[uid].halfDay++;
      } else if (record.status === 'present') {
        employeeStats[uid].present++;
      } else {
        employeeStats[uid].absent++;
      }
    });

    return Object.values(employeeStats);
  };

  const monthlyStats = getMonthlyStats();

  return (
    <DashboardLayout requiredRole="admin">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
            <p className="text-muted-foreground mt-1">View, edit, and track employee attendance</p>
          </motion.div>
          <div className="flex flex-wrap items-end gap-2">
            <Button onClick={() => setShowMarkDialog(true)} variant="default" className="gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              <UserPlus className="h-4 w-4" />
              Mark Attendance
            </Button>
            <Button onClick={fetchAttendance} variant="outline" size="icon" className={cn(loadingRecords && "animate-spin")}>
              <Clock className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Improved Range Filter Header */}
        <Card className="border-border/50 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/30 dark:to-slate-900/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Filter className="h-4 w-4 text-primary" /> Traceability Filter
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={periodFilter === 'today' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setPeriodFilter('today')}
                    className="rounded-full px-6"
                  >
                    Today
                  </Button>
                  <Button 
                    variant={periodFilter === 'week' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setPeriodFilter('week')}
                    className="rounded-full px-6"
                  >
                    Weekly
                  </Button>
                  <Button 
                    variant={periodFilter === 'month' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setPeriodFilter('month')}
                    className="rounded-full px-6"
                  >
                    Monthly
                  </Button>
                  <Button 
                    variant={periodFilter === 'custom' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setPeriodFilter('custom')}
                    className="rounded-full px-6"
                  >
                    Custom Range
                  </Button>
                </div>
                {periodFilter === 'custom' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="flex items-center gap-3 pt-2"
                  >
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-auto h-9" />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-auto h-9" />
                  </motion.div>
                )}
              </div>

              {/* Real-time Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-[300px]">
                <div className="p-3 rounded-xl bg-background border border-border/50 shadow-sm text-center">
                  <p className="text-xl font-bold text-primary">{summary.present + summary.halfDay + summary.absent}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Records</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-xl font-bold text-emerald-600">{summary.present}</p>
                  <p className="text-[10px] text-emerald-600/70 uppercase font-bold">Present</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <p className="text-xl font-bold text-amber-600">{summary.halfDay}</p>
                  <p className="text-[10px] text-amber-600/70 uppercase font-bold">Half Day</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <p className="text-xl font-bold text-rose-600">{summary.absent}</p>
                  <p className="text-[10px] text-rose-600/70 uppercase font-bold">Absent</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Records Header and Search */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" /> Attendance Records
              </CardTitle>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 w-[200px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-2 h-9">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingRecords ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                <p>Fetching records for selected period...</p>
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No records found for the selected filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredAttendance.map((record) => {
                        const userName = (record.user_id && typeof record.user_id === 'object' ? (record.user_id as any).name : record.user_name) || 'Unknown';
                        return (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={record._id || record.id}
                          >
                            <TableCell className="font-semibold">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                  {(userName || '').split(' ').map(n=>n[0]).join('').substring(0,2)}
                                </div>
                                {userName}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-mono">{record.date ? format(parseISO(record.date), 'dd/MM/yyyy') : '-'}</TableCell>
                            <TableCell className="text-emerald-600 font-medium">
                              {record.check_in ? format(new Date(record.check_in), 'hh:mm a') : '--:--'}
                            </TableCell>
                            <TableCell className="text-amber-600 font-medium">
                              {record.check_out ? format(new Date(record.check_out), 'hh:mm a') : '--:--'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {record.duration_minutes !== undefined ? (
                                `${Math.floor(record.duration_minutes / 60)}h ${record.duration_minutes % 60}m`
                              ) : '-'}
                            </TableCell>
                            <TableCell>{getStatusBadge(record)}</TableCell>
                            <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground italic">
                              {record.notes || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingAttendance(record)}
                                className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-colors"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" /> Performance Summary (Selected Period)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {monthlyStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No summary data available</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-16">S.No</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Half Day</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-center">Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyStats.map((stat, index) => {
                      const effectivePresent = stat.present + (stat.halfDay * 0.5);
                      const total = stat.present + stat.halfDay + stat.absent;
                      const percentage = total > 0 ? Math.round((effectivePresent / total) * 100) : 0;
                      return (
                        <TableRow key={index}>
                          <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium text-sm">{stat.name}</TableCell>
                          <TableCell className="text-center text-emerald-600 font-bold">{stat.present}</TableCell>
                          <TableCell className="text-center text-amber-600 font-bold">{stat.halfDay}</TableCell>
                          <TableCell className="text-center text-rose-600 font-bold">{stat.absent}</TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              'px-3 py-1 rounded-full text-[10px] font-bold uppercase',
                              percentage >= 80 ? 'bg-emerald-500/10 text-emerald-600' :
                                percentage >= 60 ? 'bg-amber-500/10 text-amber-600' :
                                  'bg-rose-500/10 text-rose-600'
                            )}>
                              {percentage}%
                            </span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HolidayManagement />
          <LocationTrendReport attendance={attendanceRecords} />
        </div>
        
        <AttendanceMapView attendance={attendanceRecords} selectedDate={startDate} employees={employees} />
        <EmployeeAttendanceExport employees={employees} holidays={holidays} />
      </motion.div>

      <AttendanceEditDialog
        attendance={editingAttendance}
        open={!!editingAttendance}
        onOpenChange={(open) => !open && setEditingAttendance(null)}
        onSave={updateAttendance}
      />

      <AdminMarkAttendanceDialog
        open={showMarkDialog}
        onOpenChange={setShowMarkDialog}
        employees={employees}
        onSave={adminMarkAttendance}
      />
    </DashboardLayout>
  );
};

export default AdminAttendance;
