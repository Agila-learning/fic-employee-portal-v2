import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching expenses', description: error.message, variant: 'destructive' });
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  };

  const fetchCredits = async () => {
    const { data, error } = await supabase
      .from('expense_credits')
      .select('*')
      .order('credit_date', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching credits', description: error.message, variant: 'destructive' });
    } else {
      setCredits(data || []);
    }
  };

  const addExpense = async (expense: { expense_date: string; amount: number; description: string; category: string; receipt_url?: string }) => {
    if (!user) return;
    const { error } = await supabase.from('expenses').insert({ ...expense, user_id: user.id, approval_status: 'pending' });
    if (error) {
      toast({ title: 'Error adding expense', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Expense submitted for approval' });
      fetchExpenses();
    }
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting expense', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Expense deleted' });
      fetchExpenses();
    }
  };

  const updateExpenseStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!user) return;
    const { error } = await supabase.from('expenses').update({ approval_status: status, approved_by: user.id, approved_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      toast({ title: 'Error updating expense', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Expense ${status}` });
      fetchExpenses();
    }
  };

  const addCredit = async (credit: { credit_date: string; amount: number; given_by: string; given_by_role: string; description?: string }) => {
    if (!user) return;
    const { error } = await supabase.from('expense_credits').insert({ ...credit, user_id: user.id });
    if (error) {
      toast({ title: 'Error adding credit', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Credit added successfully' });
      fetchCredits();
    }
  };

  const deleteCredit = async (id: string) => {
    const { error } = await supabase.from('expense_credits').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting credit', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Credit deleted' });
      fetchCredits();
    }
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('expense-receipts').upload(filePath, file, { upsert: false });
    if (error) {
      toast({ title: 'Error uploading receipt', description: error.message, variant: 'destructive' });
      return null;
    }
    return filePath;
  };

  const getReceiptUrl = async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from('expense-receipts').createSignedUrl(path, 900);
    if (error) return null;
    return data.signedUrl;
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchCredits();
    }
  }, [user]);

  return { expenses, credits, loading, addExpense, deleteExpense, addCredit, deleteCredit, updateExpenseStatus, uploadReceipt, getReceiptUrl, fetchExpenses, fetchCredits };
};
