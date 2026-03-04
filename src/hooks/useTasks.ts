import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TaskSchema, TaskUpdateSchema, validateInput } from '@/utils/validation';
import { utilityService } from '@/api/utilityService';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assignee_name?: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await utilityService.getTasks();
      setTasks(data.map((t: any) => ({
        ...t,
        id: t._id,
        status: t.status as 'pending' | 'in_progress' | 'completed',
        assignee_name: t.assigned_to?.name || 'Unknown'
      })));
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (task: { title: string; description?: string; assigned_to: string; due_date?: string }) => {
    if (!user) return { error: new Error('Not authenticated') };

    const validation = validateInput(TaskSchema, task);
    if (!validation.success) {
      toast({ title: 'Validation Error', description: validation.error, variant: 'destructive' });
      return { error: new Error(validation.error) };
    }

    try {
      await utilityService.createTask(validation.data);
      toast({ title: 'Success', description: 'Task assigned successfully' });
      fetchTasks();
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const updateTask = async (taskId: string, updates: { title?: string; description?: string; assigned_to?: string; due_date?: string }) => {
    toast({ title: 'Update task migration pending' });
    return { error: null };
  };

  const updateTaskStatus = async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      await utilityService.updateTaskStatus(taskId, status);
      toast({ title: 'Success', description: 'Task status updated' });
      fetchTasks();
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const deleteTask = async (taskId: string) => {
    toast({ title: 'Delete task migration pending' });
    return { error: null };
  };

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  return { tasks, loading, fetchTasks, createTask, updateTask, updateTaskStatus, deleteTask };
};
