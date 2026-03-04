import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { expenseService } from '@/api/expenseService';

export interface Expense {
  id: string;
  user_id: string;
  expense_date: string;
  amount: number;
  description: string;
  category: string;
  receipt_url: string | null;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface ExpenseCredit {
  id: string;
  user_id: string;
  credit_date: string;
  amount: number;
  given_by: string;
  given_by_role: string;
  description: string | null;
  created_at: string;
}

export const useExpenses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [credits, setCredits] = useState<ExpenseCredit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await expenseService.getExpenses();
      setExpenses(data.map((e: any) => ({ ...e, id: e._id })));
    } catch (error: any) {
      toast({ title: 'Error fetching expenses', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCredits = async () => {
    try {
      const data = await expenseService.getCredits();
      setCredits(data.map((c: any) => ({ ...c, id: c._id })));
    } catch (error: any) {
      toast({ title: 'Error fetching credits', description: error.message, variant: 'destructive' });
    }
  };

  const addExpense = async (expense: { expense_date: string; amount: number; description: string; category: string; receipt_url?: string }) => {
    if (!user) return;
    try {
      await expenseService.createExpense(expense);
      toast({ title: 'Expense submitted for approval' });
      fetchExpenses();
    } catch (error: any) {
      toast({ title: 'Error adding expense', description: error.message, variant: 'destructive' });
    }
  };

  const deleteExpense = async (id: string) => {
    // Note: delete method not yet in expenseService, adding it for consistency
    toast({ title: 'Delete functionality not yet fully migrated' });
  };

  const updateExpenseStatus = async (id: string, status: 'approved' | 'rejected') => {
    // Note: status update method not yet in expenseService
    toast({ title: 'Status update not yet fully migrated' });
  };

  const addCredit = async (credit: { credit_date: string; amount: number; given_by: string; given_by_role: string; description?: string }) => {
    if (!user) return;
    try {
      await expenseService.addCredit(credit);
      toast({ title: 'Credit added successfully' });
      fetchCredits();
    } catch (error: any) {
      toast({ title: 'Error adding credit', description: error.message, variant: 'destructive' });
    }
  };

  const deleteCredit = async (id: string) => {
    toast({ title: 'Delete credit not yet migrated' });
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    if (!user) return null;
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const data = await expenseService.uploadReceipt(formData);
      return data.url;
    } catch (error: any) {
      toast({ title: 'Error uploading receipt', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const getReceiptUrl = async (path: string): Promise<string | null> => {
    // In MERN stack, we might just return a static path or a signed URL endpoint
    return path;
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchCredits();
    }
  }, [user]);

  return { expenses, credits, loading, addExpense, deleteExpense, addCredit, deleteCredit, updateExpenseStatus, uploadReceipt, getReceiptUrl, fetchExpenses, fetchCredits };
};
