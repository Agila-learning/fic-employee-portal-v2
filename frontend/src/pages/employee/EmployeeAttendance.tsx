import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { operationService } from '@/api/operationService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AttendanceCard from '@/components/dashboard/AttendanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, History, AlertCircle, Send } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Request Form State
  const [requestForm, setRequestForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    requested_status: 'present',
    reason: ''
  });

  const fetchAttendance = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await (operationService as any).getMyAttendance();
      setAttendanceHistory(data || []);
      
      const reqData = await (operationService as any).getMyAttendanceRequests();
      setRequests(reqData || []);
    } catch (error) {
      toast.error('Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate current month
    const selectedDate = new Date(requestForm.date);
    const now = new Date();
    if (!isWithinInterval(selectedDate, { start: startOfMonth(now), end: endOfMonth(now) })) {
      toast.error('You can only request corrections for dates in the current month.');
      return;
    }

    setIsSubmitting(true);
    try {
      await (operationService as any).createAttendanceRequest(requestForm);
      toast.success('Attendance correction request submitted successfully');
      setIsRequestModalOpen(false);
      setRequestForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        requested_status: 'present',
        reason: ''
      });
      fetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        <div className="animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-heading">Attendance Tracking</h1>
            <p className="text-muted-foreground">Manage your daily check-in/check-out and view history</p>
          </div>

          <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary shadow-lg shadow-primary/20">
                <AlertCircle className="mr-2 h-4 w-4" /> Request Correction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Attendance Correction Request
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRequestSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Missing Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={requestForm.date}
                    onChange={(e) => setRequestForm({...requestForm, date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Requested Status</Label>
                  <Select 
                    value={requestForm.requested_status} 
                    onValueChange={(val) => setRequestForm({...requestForm, requested_status: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="half-day">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Correction</Label>
                  <Textarea 
                    id="reason" 
                    placeholder="e.g. Forgot to mark attendance / System window closed"
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full gradient-primary">
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Attendance Card */}
          <div className="lg:col-span-1 space-y-6">
            <AttendanceCard />

            {/* Pending Requests */}
            {requests.length > 0 && (
              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" /> Recent Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {requests.slice(0, 3).map((req) => (
                    <div key={req._id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50 text-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold">{format(parseISO(req.date), 'dd MMM')}</span>
                        <span className="text-muted-foreground capitalize">{req.requested_status}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          req.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-amber-50 text-amber-600 border-amber-200'
                        }
                      >
                        {req.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
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
                        <TableRow key={record.id || record._id || `row-${record.date}`}>
                          <TableCell className="font-medium">
                            {record.date ? format(parseISO(record.date), 'dd MMM yyyy') : 'No Date'}
                          </TableCell>
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
                            {record.date && new Date(record.date).getDay() === 0 ? (
                              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                                Sunday
                              </Badge>
                            ) : (
                              <Badge variant={record.status === 'present' ? 'default' : 'outline'} className={record.status === 'present' ? 'bg-emerald-500 hover:bg-emerald-600 border-none' : ''}>
                                {record.status}
                              </Badge>
                            )}
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

