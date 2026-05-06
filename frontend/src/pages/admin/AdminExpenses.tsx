import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { IndianRupee, BarChart3, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [selectedBranch, setSelectedBranch] = useState<string>('All');

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
          {user?.role !== 'super-admin' && (
            <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border/50">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[180px] h-9 border-none shadow-none focus:ring-0">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Branches</SelectItem>
                  <SelectItem value="chennai">Chennai</SelectItem>
                  <SelectItem value="bangalore">Bangalore</SelectItem>
                  <SelectItem value="thirupattur">Thirupattur</SelectItem>
                  <SelectItem value="krishnagiri">Krishnagiri</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={cn("grid w-full grid-cols-2", (user?.role === 'admin' || user?.role === 'sub-admin' || user?.role === 'md') && "sm:w-[600px] grid-cols-3")}>
            <TabsTrigger value="my-expenses">My Expenses</TabsTrigger>
            <TabsTrigger value="employee-expenses">Employee Expenses</TabsTrigger>
            {(user?.role === 'admin' || user?.role === 'sub-admin' || user?.role === 'md') && <TabsTrigger value="md-expenses">Admin & MD Expenses</TabsTrigger>}
          </TabsList>

          <TabsContent value="my-expenses" className="mt-6">
            <AdminMyExpenses />
          </TabsContent>

          <TabsContent value="employee-expenses" className="mt-6">
            <EmployeeExpenseManagement roleFilter="employee" branch={selectedBranch} />
          </TabsContent>

          {(user?.role === 'admin' || user?.role === 'sub-admin' || user?.role === 'md') && (
            <TabsContent value="md-expenses" className="mt-6">
              <div className="space-y-6">
                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden p-6 text-center">
                   <div className="flex flex-col items-center gap-4 py-8">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      >
                        <BarChart3 className="h-12 w-12 text-primary/40" />
                      </motion.div>
                      <h3 className="text-lg font-semibold">Admin & MD Expense Analytics</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Real-time visualization of Admin and MD operational costs and budget utilization.
                      </p>
                   </div>
                </Card>
                <EmployeeExpenseManagement roleFilter="admin-md" branch={selectedBranch} />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminExpenses;
