import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { operationService } from '@/api/operationService';
import { leadService } from '@/api/leadService';

export interface Expense {
  _id: string;
  id: string;
  user_id: any;
  expense_date: string;
  amount: number;
  description: string;
  category: string;
  receipt_url: string | null;
  approval_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  createdAt: string;
}

export interface ExpenseCredit {
  _id: string;
  id: string;
  user_id: any;
  credit_date: string;
  amount: number;
  given_by: string;
  given_by_role: string;
  description: string | null;
  createdAt: string;
}

export const useExpenses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [credits, setCredits] = useState<ExpenseCredit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await operationService.getMyExpenses();
      setExpenses(data.map((e: any) => ({ ...e, id: e._id })));
    } catch (error: any) {
      toast({ title: 'Error fetching expenses', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCredits = async () => {
    if (!user) return;
    try {
      const data = await operationService.getMyCredits();
      setCredits(data.map((c: any) => ({ ...c, id: c._id })));
    } catch (error: any) {
      toast({ title: 'Error fetching credits', description: error.message, variant: 'destructive' });
    }
  };

  const fetchAllExpenses = async () => {
    setLoading(true);
    try {
      const data = await operationService.getAllExpenses({});
      return data.map((e: any) => ({ ...e, id: e._id }));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: { expense_date: string; amount: number; description: string; category: string; receipt_url?: string; approval_status?: string }) => {
    if (!user) return;
    try {
      await operationService.createExpense(expense);
      toast({ title: 'Expense recorded' });
      fetchExpenses();
    } catch (error: any) {
      toast({ title: 'Error adding expense', description: error.message, variant: 'destructive' });
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await operationService.deleteExpense(id);
      toast({ title: 'Expense deleted' });
      fetchExpenses();
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
  };

  const updateExpenseStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await operationService.updateExpenseStatus(id, status);
      toast({ title: `Expense ${status}` });
      fetchExpenses();
    } catch (error: any) {
      toast({ title: 'Status update failed', description: error.message, variant: 'destructive' });
    }
  };

  const addCredit = async (credit: { credit_date: string; amount: number; given_by: string; given_by_role: string; description?: string }) => {
    if (!user) return;
    try {
      await operationService.createCredit(credit);
      toast({ title: 'Credit added successfully' });
      fetchCredits();
    } catch (error: any) {
      toast({ title: 'Error adding credit', description: error.message, variant: 'destructive' });
    }
  };

  const deleteCredit = async (id: string) => {
    try {
      await operationService.deleteCredit(id);
      toast({ title: 'Credit record removed' });
      fetchCredits();
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    if (!user) return null;
    try {
      // Use leadService for uploads as it's common
      const res = await leadService.uploadFile(file, 'expense-receipts', user.id);
      return res.path;
    } catch (error: any) {
      toast({ title: 'Error uploading', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const getReceiptUrl = async (path: string): Promise<string | null> => {
    try {
      const data = await leadService.getSignedUrl('expense-receipts', path);
      return data.signedUrl || null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchCredits();
    }
  }, [user]);

  return { expenses, credits, loading, addExpense, deleteExpense, addCredit, deleteCredit, updateExpenseStatus, uploadReceipt, getReceiptUrl, fetchExpenses, fetchCredits };
};
