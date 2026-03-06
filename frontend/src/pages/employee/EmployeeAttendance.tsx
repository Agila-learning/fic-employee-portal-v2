import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { operationService } from '@/api/operationService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AttendanceCard from '@/components/dashboard/AttendanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, CheckCircle, XCircle, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await (operationService as any).getMyAttendance();
      setAttendanceHistory(data || []);
    } catch (error) {
      toast.error('Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground font-heading">Attendance Tracking</h1>
          <p className="text-muted-foreground">Manage your daily check-in/check-out and view history</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Attendance Card */}
          <div className="lg:col-span-1">
            <AttendanceCard />
          </div>

          {/* Attendance History */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden h-full">
              <CardHeader className="border-b border-border/50 bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-4 w-4" /> Attendance History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Date</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading history...</TableCell></TableRow>
                      ) : attendanceHistory.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No attendance records found</TableCell></TableRow>
                      ) : attendanceHistory.map((record) => (
                        <TableRow key={record._id || record.id}>
                          <TableCell className="font-medium">{format(parseISO(record.date), 'dd MMM yyyy')}</TableCell>
                          <TableCell className="text-emerald-600 font-medium">
                            {record.check_in
                              ? format(new Date(record.check_in), 'hh:mm a')
                              : '--:--'}
                          </TableCell>
                          <TableCell className="text-amber-600 font-medium">
                            {record.check_out
                              ? format(new Date(record.check_out), 'hh:mm a')
                              : '--:--'}
                          </TableCell>
                          <TableCell>
                            {record.duration || (record.check_in && record.check_out
                              ? (() => {
                                const mins = Math.floor((new Date(record.check_out).getTime() - new Date(record.check_in).getTime()) / 60000);
                                return `${Math.floor(mins / 60)}h ${mins % 60}m`;
                              })()
                              : '-')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.status === 'present' ? 'default' : 'outline'} className={record.status === 'present' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeAttendance;
