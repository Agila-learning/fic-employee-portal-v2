import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { icon: CheckCircle, label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { icon: XCircle, label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const LeaveRequestsList = () => {
  const { leaveRequests, isLoading, deleteLeaveRequest } = useLeaveRequests();

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await deleteLeaveRequest(id);
      toast.success('Leave request deleted');
    } catch (error) {
      toast.error('Failed to delete leave request');
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">Loading...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden animate-fade-in">
      <CardHeader className="border-b border-border/50 bg-muted/30 pb-3">
        <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Calendar as CalendarIcon className="h-5 w-5 text-blue-500" />
          My Leave Requests
          {leaveRequests.length > 0 && (
            <Badge variant="secondary" className="ml-auto">{leaveRequests.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {leaveRequests.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No leave requests yet
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {leaveRequests.map((req) => {
              const config = statusConfig[req.status];
              const StatusIcon = config.icon;
              return (
                <div key={req.id || req._id} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/30 transition-colors group">
                  <div className={cn('p-2 rounded-lg', config.className)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{format(new Date(req.leave_date), 'PPP')}</p>
                    <p className="text-xs text-muted-foreground truncate">{req.reason}</p>
                  </div>
                  <Badge className={cn('text-xs shrink-0', config.className)}>
                    {config.label}
                  </Badge>
                  {req.status === 'pending' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive transition-colors" onClick={() => handleDelete(req.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveRequestsList;

