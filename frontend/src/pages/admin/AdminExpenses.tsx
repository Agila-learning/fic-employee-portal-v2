import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { IndianRupee } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatWindow from '@/components/chat/ChatWindow';
import { cn, getInitials } from '@/lib/utils';
import AdminMyExpenses from './AdminMyExpenses';
import EmployeeExpenseManagement from './EmployeeExpenseManagement';

export const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#06b6d4', '#e11d48'];

export const CATEGORIES = [
  'Tea/Coffee', 'Snacks', 'Pooja Materials', 'Office Use Things',
  'Sanitary Products', 'Food', 'Transport', 'Travel',
  'Office Supplies', 'Courier Charges', 'Petrol', 'Marketing', 'Lead Generation', 'Others'
];

const AdminExpenses = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-expenses');

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <IndianRupee className="h-8 w-8 text-primary" /> {user?.role === 'md' ? 'Expenses Management' : 'Admin Expenses'}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              {user?.role === 'md' ? 'Oversight of employee expenses and personal records' : 'Comprehensive expense oversight and management'}
            </p>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={cn("grid w-full grid-cols-2", user?.role === 'md' && "sm:w-[600px] grid-cols-3", user?.role === 'admin' && "sm:w-[400px] grid-cols-2")}>
            <TabsTrigger value="my-expenses">My Expenses</TabsTrigger>
            <TabsTrigger value="employee-expenses">Employee Expenses</TabsTrigger>
            {user?.role === 'md' && <TabsTrigger value="md-expenses">MD Expenses</TabsTrigger>}
          </TabsList>

          <TabsContent value="my-expenses" className="mt-6">
            <AdminMyExpenses />
          </TabsContent>

          <TabsContent value="employee-expenses" className="mt-6">
            <EmployeeExpenseManagement roleFilter="employee" />
          </TabsContent>

          {user?.role === 'md' && (
            <TabsContent value="md-expenses" className="mt-6">
              <EmployeeExpenseManagement roleFilter="md" />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminExpenses;
