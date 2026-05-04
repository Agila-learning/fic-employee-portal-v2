import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useEmployees } from '@/hooks/useEmployees';
import { operationService } from '@/api/operationService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import { 
  Users, 
  FileSpreadsheet, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Trophy, 
  Star, 
  Calendar as CalendarIcon, 
  ClipboardList,
  IndianRupee,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AttendanceCard from '@/components/dashboard/AttendanceCard';
import TasksCard from '@/components/dashboard/TasksCard';
import AnnouncementsCard from '@/components/dashboard/AnnouncementsCard';
import { format, startOfMonth, isSameDay } from 'date-fns';
import { safeParseDate } from '@/lib/utils';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { leads } = useLeads(100);
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        const data = await operationService.getAllAttendance({ startDate: startOfYear, endDate: endOfYear });
        setAttendance(data || []);
      } catch (error) {
        console.error('Failed to fetch attendance', error);
      }
    };
    fetchAttendance();
  }, []);

  const attendanceStats = useMemo(() => {
    const now = new Date();
    const todayAttendance = attendance.filter(a => isSameDay(safeParseDate(a.date), now));
    const present = todayAttendance.filter(a => a.status === 'present').length;
    const absent = todayAttendance.filter(a => a.status === 'absent').length;
    return { present, absent, total: employees.filter(e => e?.role === 'employee').length };
  }, [attendance, employees]);

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const successLeads = leads.filter(l => l.status === 'success').length;
    const conversionRate = totalLeads > 0 ? Math.round((successLeads / totalLeads) * 100) : 0;
    return { totalLeads, successLeads, conversionRate };
  }, [leads]);

  return (
    <DashboardLayout requiredRole="admin">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 md:space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>

        {/* Team Overview Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <StatsCard
            title="Total Employees"
            value={employees.length}
            icon={Users}
            iconClassName="bg-blue-500"
            delay={0}
            link="/admin/employees"
          />
          <StatsCard
            title="Total Leads"
            value={stats.totalLeads}
            icon={FileSpreadsheet}
            iconClassName="bg-purple-500"
            delay={100}
            link="/admin/leads"
          />
          <StatsCard
            title="Present Today"
            value={attendanceStats.present}
            icon={CheckCircle}
            iconClassName="bg-emerald-500"
            delay={200}
            link="/admin/attendance"
          />
          <StatsCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            icon={TrendingUp}
            iconClassName="bg-amber-500"
            delay={300}
          />
          <StatsCard
            title="Success Stories"
            value={stats.successLeads}
            icon={Star}
            iconClassName="bg-rose-500"
            delay={400}
            link="/admin/success-stories"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Team Attendance Mini-Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" /> Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{attendanceStats.present}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-rose-600">{attendanceStats.absent}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Absent</p>
                </div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: attendanceStats.total > 0 ? `${(attendanceStats.present / attendanceStats.total) * 100}%` : '0%' }} />
                <div className="h-full bg-rose-500" style={{ width: attendanceStats.total > 0 ? `${(attendanceStats.absent / attendanceStats.total) * 100}%` : '0%' }} />
              </div>
            </CardContent>
          </Card>

          {/* Personal Section Header */}
          <div className="lg:col-span-3 pt-4 border-t border-border/50">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" /> My Personal Activity
            </h2>
          </div>

          <AttendanceCard />
          <TasksCard />
          <AnnouncementsCard />
        </div>

        {/* Quick Links for Personal Tasks */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => (window.location.href = '/employee/reports')}>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Post My Report</span>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => (window.location.href = '/employee/expenses')}>
            <CardContent className="p-4 flex items-center gap-3">
              <IndianRupee className="h-5 w-5 text-emerald-500" />
              <span className="font-medium">Add My Expense</span>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => (window.location.href = '/employee/tasks')}>
            <CardContent className="p-4 flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-purple-500" />
              <span className="font-medium">My Tasks</span>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => (window.location.href = '/employee/resignation')}>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-rose-500" />
              <span className="font-medium">Resignation Status</span>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
