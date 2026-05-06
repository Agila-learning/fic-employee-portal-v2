import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useEmployees } from '@/hooks/useEmployees';
import { operationService } from '@/api/operationService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import LeadFormDialog from '@/components/leads/LeadFormDialog';
import { Users, FileSpreadsheet, UserCheck, TrendingUp, CheckCircle, Clock, Bell, ArrowRight, Trophy, CreditCard, Briefcase, Star, Calendar as CalendarIcon, Loader2, MessageSquare, Key, Download } from 'lucide-react';
import AdminLeaveRequests from '@/components/leave/AdminLeaveRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { credentialService } from '@/api/credentialService';
import { reportService } from '@/api/reportService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { STATUS_OPTIONS, STATUS_OPTIONS_ADMIN, Lead, INTERESTED_DOMAIN_OPTIONS } from '@/types';
import { cn, safeParseDate, getInitials } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { employees } = useEmployees();
  const { leads, refetchLeads } = useLeads(100);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceRange, setAttendanceRange] = useState<'today' | 'week' | 'month'>('today');
  const [projectCount, setProjectCount] = useState(0);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    department: 'all',
    branch: 'All'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('All');

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoadingAttendance(true);
      try {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        
        const params: any = { startDate: startOfYear, endDate: endOfYear };
        if (selectedBranch !== 'All') params.branch = selectedBranch;
        
        const data = await operationService.getAllAttendance(params);
        setAttendance(data || []);
      } catch (error) {
        console.error('Failed to fetch attendance', error);
      } finally {
        setLoadingAttendance(false);
      }
    };

    const fetchProjectCount = async () => {
      try {
        const data = await credentialService.getProjects();
        setProjectCount(data.length);
      } catch (error) {
        console.error('Failed to fetch projects', error);
      }
    };

    fetchAttendance();
    fetchProjectCount();
  }, [selectedBranch]);

  const attendanceStats = useMemo(() => {
    let filtered = attendance;
    const now = new Date();
    if (attendanceRange === 'today') {
      filtered = attendance.filter(a => isSameDay(safeParseDate(a.date), now));
    } else if (attendanceRange === 'week') {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      filtered = attendance.filter(a => isWithinInterval(safeParseDate(a.date), { start, end }));
    } else if (attendanceRange === 'month') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      filtered = attendance.filter(a => isWithinInterval(safeParseDate(a.date), { start, end }));
    }

    const present = filtered.filter(a => a.status === 'present').length;
    const absent = filtered.filter(a => a.status === 'absent').length;
    const halfDay = filtered.filter(a => a.status === 'half_day').length;
    
    return { 
      present, 
      absent, 
      halfDay, 
      total: employees.filter(e => e?.role === 'employee').length 
    };
  }, [attendance, attendanceRange, employees]);

  const filteredEmployees = useMemo(() => {
    if (selectedBranch === 'All') return employees;
    return employees.filter(e => e.branch === selectedBranch);
  }, [employees, selectedBranch]);

  const activeEmployees = filteredEmployees.filter(e => e.is_active !== false);
  const activeEmployeeCount = activeEmployees.length;
  
  const filteredLeads = useMemo(() => {
    if (selectedBranch === 'All') return leads;
    return leads.filter(l => l.branch === selectedBranch);
  }, [leads, selectedBranch]);

  const totalLeads = filteredLeads.length;
  const convertedLeads = filteredLeads.filter(l => l.status === 'converted').length;
  const successLeads = filteredLeads.filter(l => l.status === 'success').length;
  const pendingLeads = filteredLeads.filter(l => ['nc1', 'nc2', 'nc3', 'follow_up'].includes(l.status)).length;

  // Payment stage counts (with safety checks)
  const registrationDone = filteredLeads.filter(l => l?.payment_stage === 'registration_done').length;
  const initialPaymentDone = filteredLeads.filter(l => l?.payment_stage === 'initial_payment_done').length;
  const fullPaymentDone = filteredLeads.filter(l => l?.payment_stage === 'full_payment_done').length;

  // Domain-wise payment counts
  const itPaidCount = filteredLeads.filter(l => 
    (l?.payment_stage?.toLowerCase().trim() === 'full_payment_done' || l?.status === 'success') && 
    l?.interested_domain?.toLowerCase().trim() === 'it'
  ).length;
  const nonItPaidCount = filteredLeads.filter(l => 
    (l?.payment_stage?.toLowerCase().trim() === 'full_payment_done' || l?.status === 'success') && 
    l?.interested_domain?.toLowerCase().trim() === 'non_it'
  ).length;
  const bankingPaidCount = filteredLeads.filter(l => 
    (l?.payment_stage?.toLowerCase().trim() === 'full_payment_done' || l?.status === 'success') && 
    l?.interested_domain?.toLowerCase().trim() === 'banking'
  ).length;

  // Helper to compare lead owner fields (assigned_to or created_by) vs user_id
  const matchEmployee = (field: any, empUserId: string) => {
    if (!field || !empUserId) return false;

    // If it's a string, simple comparison
    if (typeof field === 'string') return field === empUserId;

    // If it's a populated object
    if (typeof field === 'object') {
      const fieldId = field._id || field.id || field.user_id || field.toString();
      // Handle the case where fieldId itself might still be an object (or [object Object])
      if (fieldId && typeof fieldId === 'string' && fieldId !== '[object Object]') {
        return fieldId === empUserId;
      }
      // If we still didn't get a good string, try to stringify the object
      try {
        return String(field._id || field) === empUserId;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  // Helper to check lead status (case-insensitive)
  const isStatus = (status: string, targetValues: string[]) => {
    if (!status) return false;
    const lowerStatus = status.toLowerCase();
    return targetValues.map(v => v.toLowerCase()).includes(lowerStatus);
  };

  // Optimized calculation for lead stats (O(N+M))
  const { totalEmployeeSuccess, totalEmployeeLeads, conversionRate } = useMemo(() => {
    if (!employees.length || !leads.length) {
      return { totalEmployeeSuccess: 0, totalEmployeeLeads: 0, conversionRate: 0 };
    }

    // Map to quickly check if a user ID belongs to an employee we care about
    const employeeIds = new Set(employees.map(e => (e.user_id || (e as any)._id || e.id)?.toString()).filter(Boolean));
    
    let success = 0;
    let total = 0;

    leads.forEach(l => {
      const assignedId = ((l.assigned_to as any)?._id || (l.assigned_to as any)?.id || l.assigned_to)?.toString();
      const creatorId = ((l.created_by as any)?._id || (l.created_by as any)?.id || l.created_by)?.toString();
      
      const isEmployeeLead = (assignedId && employeeIds.has(assignedId)) || (creatorId && employeeIds.has(creatorId));
      
      if (isEmployeeLead) {
        total++;
        if (isStatus(l.status, ['success'])) {
          success++;
        }
      }
    });

    const rate = total > 0 ? Math.round((success / total) * 100) : 0;
    return { totalEmployeeSuccess: success, totalEmployeeLeads: total, conversionRate: rate };
  }, [employees, leads]);

  const statusDistribution = useMemo(() => STATUS_OPTIONS_ADMIN.map(status => ({
    ...status,
    count: filteredLeads.filter(l => isStatus(l.status, [status.value])).length
  })).sort((a, b) => b.count - a.count), [filteredLeads]);

  const employeePerformance = useMemo(() => {
    if (!activeEmployees.length) return [];
    
    return activeEmployees.map(emp => {
      const empId = (emp.user_id || (emp as any)._id || emp.id)?.toString();
      const empLeads = leads.filter(l => matchEmployee(l.assigned_to, empId) || matchEmployee(l.created_by, empId));
      
      return {
        ...emp,
        successCount: empLeads.filter(l => isStatus(l.status, ['success'])).length,
        converted: empLeads.filter(l => isStatus(l.status, ['converted', 'success'])).length,
        total: empLeads.length
      };
    })
    .sort((a, b) => b.converted === a.converted ? b.total - a.total : b.converted - a.converted)
    .slice(0, 5);
  }, [activeEmployees, leads]);

  // Weekly top performers
  const { weeklyPerformance, weekLabel } = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const label = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
    
    if (!activeEmployees.length || !leads.length) {
      return { weeklyPerformance: [], weekLabel: label };
    }

    const performance = activeEmployees.map(emp => {
      const empId = (emp.user_id || (emp as any)._id || emp.id)?.toString();
      const weeklyLeads = leads.filter(l => {
        if (!(matchEmployee(l.assigned_to, empId) || matchEmployee(l.created_by, empId))) return false;
        if (!isStatus(l.status, ['converted', 'success'])) return false;
        if (!l.updated_at) return false;
        try {
          const date = parseISO(l.updated_at);
          return isWithinInterval(date, { start: weekStart, end: weekEnd });
        } catch {
          return false;
        }
      });
      
      return { 
        ...emp, 
        weeklySuccess: weeklyLeads.length, 
        total: leads.filter(l => matchEmployee(l.assigned_to, empId) || matchEmployee(l.created_by, empId)).length 
      };
    })
      .filter(e => e.weeklySuccess > 0)
      .sort((a, b) => b.weeklySuccess === a.weeklySuccess ? b.total - a.total : b.weeklySuccess - a.weeklySuccess)
      .slice(0, 5);
      
    return { weeklyPerformance: performance, weekLabel: label };
  }, [activeEmployees, leads]);

  const topPerformerCount = useMemo(() => employeePerformance.filter(e => e.converted > 0).length, [employeePerformance]);

  const recentLeads = useMemo(() => [...filteredLeads]
    .filter(l => l.updated_at)
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || 0).getTime();
      const dateB = new Date(b.updated_at || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5), [filteredLeads]);

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      // Ensure current selected branch is included in report filters
      const finalFilters = { 
        ...reportFilters, 
        branch: selectedBranch 
      };
      await reportService.exportReports(finalFilters);
      toast.success('Report downloaded successfully');
      setIsReportDialogOpen(false);
    } catch (error) {
      console.error('Export failed', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department).filter(Boolean));
    return ['all', ...Array.from(depts)];
  }, [employees]);

  return (
    <DashboardLayout requiredRole="admin">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 md:space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            {user?.role !== 'super-admin' && (
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[180px] h-9 mt-2">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Branches</SelectItem>
                  <SelectItem value="chennai">Chennai</SelectItem>
                  <SelectItem value="bangalore">Bangalore</SelectItem>
                  <SelectItem value="thirupattur">Thirupattur</SelectItem>
                  <SelectItem value="krishnagiri">Krishnagiri</SelectItem>
                </SelectContent>
              </Select>
            )}
          </motion.div>
          
          <Button 
            onClick={() => setIsReportDialogOpen(true)}
            variant="outline"
            className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Download className="h-4 w-4" /> Download Reports
          </Button>
        </div>

        {/* Stats Cards with staggered animation */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          <StatsCard
            title="Total Employees"
            value={employees.length}
            icon={Users}
            iconClassName="bg-gradient-to-br from-blue-500 to-blue-600"
            delay={0}
            link="/admin/employees"
          />
          <StatsCard
            title="Active Team"
            value={activeEmployeeCount}
            icon={UserCheck}
            iconClassName="bg-gradient-to-br from-amber-500 to-amber-600"
            delay={100}
            link="/admin/employees"
          />
          <StatsCard
            title="Total Leads"
            value={totalLeads}
            icon={FileSpreadsheet}
            iconClassName="bg-gradient-to-br from-purple-500 to-purple-600"
            delay={150}
            link="/admin/leads"
          />
          <StatsCard
            title="Registration"
            value={registrationDone}
            icon={CreditCard}
            iconClassName="bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20"
            delay={200}
            link="/admin/leads?payment_stage=registration_done"
          />
          <StatsCard
            title="Initial Paid"
            value={initialPaymentDone}
            icon={CreditCard}
            iconClassName="bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/20"
            delay={250}
            link="/admin/leads?payment_stage=initial_payment_done"
          />
          <StatsCard
            title="Full Paid"
            value={fullPaymentDone}
            icon={CheckCircle}
            iconClassName="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20"
            delay={300}
            link="/admin/leads?payment_stage=full_payment_done"
          />
          <StatsCard
            title="Conversion"
            value={`${conversionRate}%`}
            icon={TrendingUp}
            trend={{ value: conversionRate, isPositive: conversionRate > 0 }}
            iconClassName="bg-gradient-to-br from-teal-500 to-teal-600"
            delay={350}
            link="/admin/leads"
          />
          <div className="cursor-pointer" onClick={() => document.getElementById('top-performers-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <StatsCard
              title="Success Stories"
              value={successLeads}
              icon={Star}
              iconClassName="bg-gradient-to-br from-rose-500 to-rose-600"
              delay={400}
            />
          </div>
          <StatsCard
            title="Project Vault"
            value={projectCount}
            icon={Key}
            iconClassName="bg-gradient-to-br from-indigo-500 to-indigo-600"
            delay={450}
            link="/admin/credentials"
          />
        </div>


        {/* Domain-wise Payment Stats */}
        <Card className="border-border/50 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/30 dark:to-slate-900/20 animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Full Payment by Domain</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-center">
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{itPaidCount}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">IT</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-center">
                <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{nonItPaidCount}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Non-IT</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-center">
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{bankingPaidCount}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Banking</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Attendance Overview (New Section) */}
          <Card className="border-border/50 overflow-hidden lg:col-span-1">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" /> Team Attendance
                </CardTitle>
                <div className="flex bg-muted rounded-lg p-0.5 scale-90 origin-right">
                  <button onClick={() => setAttendanceRange('today')} className={cn("px-2 py-1 text-[10px] rounded-md transition-all", attendanceRange === 'today' ? "bg-background shadow-sm font-bold" : "text-muted-foreground")}>Day</button>
                  <button onClick={() => setAttendanceRange('week')} className={cn("px-2 py-1 text-[10px] rounded-md transition-all", attendanceRange === 'week' ? "bg-background shadow-sm font-bold" : "text-muted-foreground")}>Week</button>
                  <button onClick={() => setAttendanceRange('month')} className={cn("px-2 py-1 text-[10px] rounded-md transition-all", attendanceRange === 'month' ? "bg-background shadow-sm font-bold" : "text-muted-foreground")}>Month</button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-xl font-bold text-emerald-600">{attendanceStats.present}</p>
                  <p className="text-[10px] font-medium text-emerald-600/70 uppercase">Present</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <p className="text-xl font-bold text-rose-600">{attendanceStats.absent}</p>
                  <p className="text-[10px] font-medium text-rose-600/70 uppercase">Absent</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Half Day</span>
                  <span className="font-bold">{attendanceStats.halfDay}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: attendanceStats.total > 0 ? `${(attendanceStats.present / attendanceStats.total) * 100}%` : '0%' }} />
                  <div className="h-full bg-amber-500" style={{ width: attendanceStats.total > 0 ? `${(attendanceStats.halfDay / attendanceStats.total) * 100}%` : '0%' }} />
                  <div className="h-full bg-rose-500" style={{ width: attendanceStats.total > 0 ? `${(attendanceStats.absent / attendanceStats.total) * 100}%` : '0%' }} />
                </div>
                <p className="text-[10px] text-center text-muted-foreground italic">Total Strength: {attendanceStats.total}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 text-[10px] h-8 gap-2" onClick={() => navigate('/admin/attendance')}>
                Manage Full Attendance <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          {/* Lead Status Distribution (Replaced Bar with Pie Chart) */}
          <Card className="border-border/50 overflow-hidden lg:col-span-2">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Lead Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution.filter(s => s.count > 0)}
                      cx="50%"
                      cy="45%"
                          innerRadius={40}
                          outerRadius={55}
                          paddingAngle={5}
                      dataKey="count"
                      nameKey="label"
                    >
                      {statusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Top Performers (All Time) */}
          <Card id="top-performers-section" className="border-border/50 overflow-hidden group hover:shadow-lg transition-all duration-500 hover:border-primary/20 animate-slide-up stagger-2">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Top Performers
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">All-time conversions ranking</p>
                </div>
                <div onClick={() => navigate('/admin/employees')}>
                  <Button variant="ghost" size="sm" className="gap-1 group/btn">
                    View All
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {employeePerformance.filter(e => e.converted > 0).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No conversions yet</p>
                ) : employeePerformance.filter(e => e.converted > 0).map((emp, index) => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer group/emp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                      index === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30" :
                        index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700" :
                          index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" :
                            "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md group-hover/emp:shadow-lg group-hover/emp:scale-105 transition-all duration-300">
                      <span className="text-sm font-bold text-white">{getInitials(emp.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate group-hover/emp:text-primary transition-colors">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.total} leads • {emp.successCount} success</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-success">
                        <Trophy className="h-5 w-5" />
                        <span className="text-xl font-bold">{emp.converted}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">conversions</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Top Performers */}
          <Card className="border-border/50 overflow-hidden group hover:shadow-lg transition-all duration-500 hover:border-primary/20 animate-slide-up stagger-2">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Weekly Top Performers
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Week of {weekLabel}</p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {weeklyPerformance.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No conversions this week yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{weekLabel}</p>
                  </div>
                ) : weeklyPerformance.map((emp, index) => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer group/emp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                      index === 0 ? "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/30" :
                        index === 1 ? "bg-gradient-to-br from-emerald-300 to-emerald-400 text-emerald-800" :
                          index === 2 ? "bg-gradient-to-br from-teal-400 to-teal-600 text-white" :
                            "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md group-hover/emp:shadow-lg group-hover/emp:scale-105 transition-all duration-300">
                      <span className="text-sm font-bold text-white">{getInitials(emp.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate group-hover/emp:text-primary transition-colors">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">This week's conversions</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 text-green-600">
                          <Star className="h-5 w-5" />
                          <span className="text-xl font-bold">{emp.weeklySuccess}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">this week</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full hover:bg-primary/20 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/admin/messages', { state: { selectedUserId: emp.id } });
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-border/50 overflow-hidden hover:shadow-lg transition-all duration-500 animate-slide-up stagger-3">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Recent Activity
              </CardTitle>
              <div onClick={() => navigate('/admin/leads')}>
                <Button variant="ghost" size="sm" className="gap-1 group/btn">
                  View All Leads
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {recentLeads.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              ) : recentLeads.map((lead, index) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] group/lead"
                  onClick={() => setViewingLead(lead)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover/lead:bg-primary/20 transition-colors">
                    <span className="text-sm font-bold text-primary">{getInitials(lead.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate group-hover/lead:text-primary transition-colors">{lead.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{lead.candidate_id}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    STATUS_OPTIONS.find(s => s.value === lead.status)?.color || "bg-muted"
                  )}>
                    {STATUS_OPTIONS.find(s => s.value === lead.status)?.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(safeParseDate(lead.updated_at), 'dd/MM/yyyy')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leave Requests Management Section */}
        <div className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Leave Requests</h2>
          </div>
          {/* Robust guard for the component */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden min-h-[100px]">
            {activeEmployeeCount > 0 ? (
              <AdminLeaveRequests branch={selectedBranch} />
            ) : (
              <div className="p-12 text-center text-muted-foreground">Initializing employee data...</div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Report Download Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Download Employee Reports</DialogTitle>
            <DialogDescription>
              Select date range and department to export reports as CSV.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right text-xs">From</Label>
              <Input
                id="startDate"
                type="date"
                value={reportFilters.startDate}
                onChange={(e) => setReportFilters(p => ({ ...p, startDate: e.target.value }))}
                className="col-span-3 h-9"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right text-xs">To</Label>
              <Input
                id="endDate"
                type="date"
                value={reportFilters.endDate}
                onChange={(e) => setReportFilters(p => ({ ...p, endDate: e.target.value }))}
                className="col-span-3 h-9"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dept" className="text-right text-xs">Dept</Label>
              <Select 
                value={reportFilters.department} 
                onValueChange={(v) => setReportFilters(p => ({ ...p, department: v }))}
              >
                <SelectTrigger className="col-span-3 h-9">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept || 'null'}>
                      {dept === 'all' ? 'All Departments' : dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {user?.role !== 'super-admin' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="branch" className="text-right text-xs">Branch</Label>
                <Select 
                  value={reportFilters.branch} 
                  onValueChange={(v) => setReportFilters(p => ({ ...p, branch: v }))}
                >
                  <SelectTrigger className="col-span-3 h-9">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Branches</SelectItem>
                    <SelectItem value="chennai">Chennai</SelectItem>
                    <SelectItem value="bangalore">Bangalore</SelectItem>
                    <SelectItem value="thirupattur">Thirupattur</SelectItem>
                    <SelectItem value="krishnagiri">Krishnagiri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700" 
              onClick={handleExportReport}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Lead Dialog */}
      {viewingLead && (
        <LeadFormDialog
          open={!!viewingLead}
          onOpenChange={(open) => !open && setViewingLead(null)}
          lead={viewingLead}
          mode="view"
          onSave={refetchLeads}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;