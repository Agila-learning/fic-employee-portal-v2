import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, UserCircle } from 'lucide-react';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import LeaveRequestForm from './LeaveRequestForm';
import { Plus } from 'lucide-react';

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { icon: CheckCircle, label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { icon: XCircle, label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const AdminLeaveRequests = () => {
  const { leaveRequests, isLoading, updateLeaveStatus } = useLeaveRequests();

  const pendingRequests = leaveRequests.filter(req => req.status === 'pending');
  const processedRequests = leaveRequests.filter(req => req.status !== 'pending');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Pending Requests */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold">Pending Requests</h2>
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30">
                {pendingRequests.length}
              </Badge>
            )}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                <Plus className="h-4 w-4" />
                Request Leave for Myself
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0 border-none bg-transparent">
              <LeaveRequestForm />
            </DialogContent>
          </Dialog>
        </div>

        {pendingRequests.length === 0 ? (
          <Card className="border-border/50 border-dashed bg-muted/30">
            <CardContent className="py-8 text-center text-muted-foreground">
              No pending leave requests
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.map(req => (
              <Card key={req.id} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{req.employee_name || 'Anonymous'}</h3>
                      <p className="text-xs text-muted-foreground">
                        {req.leave_date ? format(new Date(req.leave_date), 'PPP') : 'Invalid Date'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg text-sm italic">
                    "{req.reason}"
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => updateLeaveStatus(req.id, 'approved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => updateLeaveStatus(req.id, 'rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                  
                  <p className="text-[10px] text-muted-foreground text-center">
                    Requested on {req.created_at ? format(new Date(req.created_at), 'PPP') : 'N/A'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Processed Requests */}
      <section className="space-y-4">
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              Processed Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {processedRequests.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No processed requests yet
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {processedRequests.map(req => {
                  const status = req.status as keyof typeof statusConfig;
                  const config = statusConfig[status] || statusConfig.pending;
                  const Icon = config.icon;
                  return (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-muted/10 transition-colors">
                      <div className="flex-1 flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', config.className)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{req.employee_name || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">
                            {req.leave_date ? format(new Date(req.leave_date), 'PPP') : 'N/A'} — {req.reason}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                        <div className="text-right">
                          <p className="text-muted-foreground">Reviewed on</p>
                          <p className="font-medium">
                            {req.reviewed_at ? format(new Date(req.reviewed_at), 'PP') : '-'}
                          </p>
                        </div>
                        <Badge className={cn('px-2 py-0.5', config.className)}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AdminLeaveRequests;
