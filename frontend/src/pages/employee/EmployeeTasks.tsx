import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { utilityService } from '@/api/utilityService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Calendar as CalendarIcon, ListTodo, Eye, PlayCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, parseISO, isValid } from 'date-fns';

const safeFormatDate = (dateStr: string | null | undefined, fmt = 'dd MMM yyyy') => {
  if (!dateStr) return 'No date';
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, fmt) : 'Invalid date';
  } catch {
    return 'Invalid date';
  }
};

const EmployeeTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await utilityService.getTasks();
      setTasks(data || []);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await utilityService.updateTaskStatus(taskId, newStatus);
      toast.success(`Task marked as ${newStatus.replace('_', ' ')}`);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground font-heading flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-primary" /> My Tasks
          </h1>
          <p className="text-muted-foreground">Manage and track your assigned tasks</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Pending Tasks */}
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <ListTodo className="h-4 w-4" /> Pending Tasks
                {pendingTasks.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">{pendingTasks.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Task</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading tasks...</TableCell></TableRow>
                    ) : pendingTasks.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No pending tasks — you're all caught up! 🎉</TableCell></TableRow>
                    ) : pendingTasks.map((task) => (
                      <TableRow key={task._id || task.id}>
                        <TableCell className="font-semibold">{task.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{task.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <CalendarIcon className="h-3 w-3" />
                            {safeFormatDate(task.due_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={task.status === 'in_progress' ? 'default' : 'outline'}>
                            {task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-right justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsViewDialogOpen(true);
                              }}
                              className="gap-2 hover:bg-primary/10 transition-colors"
                            >
                              <Eye className="h-4 w-4" /> View full
                            </Button>
                            {task.status !== 'in_progress' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateStatus(task._id || task.id, 'in_progress')}
                                className="gap-2 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                              >
                                <PlayCircle className="h-4 w-4" /> Start
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateStatus(task._id || task.id, 'completed')}
                              className="gap-2 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" /> Complete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Completed Tasks */}
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" /> Completed Tasks
                {completedTasks.length > 0 && (
                  <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700">{completedTasks.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Task</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedTasks.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No completed tasks yet</TableCell></TableRow>
                    ) : completedTasks.map((task) => (
                      <TableRow key={task._id || task.id} className="opacity-70">
                        <TableCell className="font-medium line-through">{task.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{task.description || '-'}</TableCell>
                        <TableCell className="text-xs">
                          {safeFormatDate(task.updatedAt || task.updated_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsViewDialogOpen(true);
                              }}
                              className="gap-2 hover:bg-primary/10 transition-colors h-7 px-2"
                            >
                              <Eye className="h-3 w-3" /> View
                            </Button>
                            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Completed</Badge>
                          </div>
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

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl pr-6">
              <ListTodo className="h-5 w-5 text-primary" />
              {selectedTask?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/30 p-4 rounded-lg border border-border/50 max-h-[300px] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
              {selectedTask?.description || 'No description provided.'}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/20 p-2 rounded-md">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                Due: {safeFormatDate(selectedTask?.due_date)}
              </div>
              <Badge variant={selectedTask?.status === 'in_progress' ? 'default' : selectedTask?.status === 'completed' ? 'secondary' : 'outline'}>
                {selectedTask?.status === 'in_progress' ? 'In Progress' : selectedTask?.status === 'completed' ? 'Completed' : 'Pending'}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EmployeeTasks;

