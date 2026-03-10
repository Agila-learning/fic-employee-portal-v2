import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useEmployees } from '@/hooks/useEmployees';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import LeadFormDialog from '@/components/leads/LeadFormDialog';
import { Users, FileSpreadsheet, UserCheck, TrendingUp, CheckCircle, Clock, Bell, ArrowRight, Trophy, CreditCard, Briefcase, Star } from 'lucide-react';
import AdminLeaveRequests from '@/components/leave/AdminLeaveRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { STATUS_OPTIONS, STATUS_OPTIONS_ADMIN, Lead, INTERESTED_DOMAIN_OPTIONS } from '@/types';
import { cn, safeParseDate } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format } from 'date-fns';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { employees } = useEmployees();
  const { leads, refetchLeads } = useLeads();
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  const activeEmployees = employees.filter(e => e.is_active);
  const activeEmployeeCount = activeEmployees.length;
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const successLeads = leads.filter(l => l.status === 'success').length;
  const pendingLeads = leads.filter(l => ['nc1', 'nc2', 'nc3', 'follow_up'].includes(l.status)).length;

  // Payment stage counts
  const registrationDone = leads.filter(l => l.payment_stage === 'registration_done').length;
  const initialPaymentDone = leads.filter(l => l.payment_stage === 'initial_payment_done').length;
  const fullPaymentDone = leads.filter(l => l.payment_stage === 'full_payment_done').length;

  // Domain-wise payment counts
  const itPaidCount = leads.filter(l => l.payment_stage === 'full_payment_done' && l.interested_domain === 'it').length;
  const nonItPaidCount = leads.filter(l => l.payment_stage === 'full_payment_done' && l.interested_domain === 'non_it').length;
  const bankingPaidCount = leads.filter(l => l.payment_stage === 'full_payment_done' && l.interested_domain === 'banking').length;

  // Helper to compare assigned_to (could be ObjectId string or populated object) vs user_id
  const matchEmployee = (leadAssignedTo: any, empUserId: string) => {
    if (!leadAssignedTo) return false;
    if (typeof leadAssignedTo === 'string') return leadAssignedTo === empUserId;
    if (typeof leadAssignedTo === 'object') {
      return leadAssignedTo._id === empUserId || leadAssignedTo.id === empUserId || String(leadAssignedTo) === empUserId;
    }
    return false;
  };

  // Calculate conversion rate based on employee success conversions only
  const totalEmployeeSuccess = employees.reduce((acc, emp) => {
    return acc + leads.filter(l => matchEmployee(l.assigned_to, emp.user_id) && l.status === 'success').length;
  }, 0);
  const totalEmployeeLeads = employees.reduce((acc, emp) => {
    return acc + leads.filter(l => matchEmployee(l.assigned_to, emp.user_id)).length;
  }, 0);
  const conversionRate = totalEmployeeLeads > 0 ? Math.round((totalEmployeeSuccess / totalEmployeeLeads) * 100) : 0;

  const statusDistribution = STATUS_OPTIONS_ADMIN.map(status => ({
    ...status,
    count: leads.filter(l => l.status === status.value).length
  })).sort((a, b) => b.count - a.count);

  const employeePerformance = activeEmployees.map(emp => ({
    ...emp,
    successCount: leads.filter(l => matchEmployee(l.assigned_to, emp.user_id) && l.status === 'success').length,
    converted: leads.filter(l => matchEmployee(l.assigned_to, emp.user_id) && (l.status === 'converted' || l.status === 'success')).length,
    total: leads.filter(l => matchEmployee(l.assigned_to, emp.user_id)).length
  }))
    .sort((a, b) => b.converted === a.converted ? b.total - a.total : b.converted - a.converted)
    .slice(0, 5);

  // Weekly top performers
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
  const weeklyPerformance = activeEmployees.map(emp => {
    const weeklyLeads = leads.filter(l =>
      matchEmployee(l.assigned_to, emp.user_id) &&
      (l.status === 'converted' || l.status === 'success') &&
      l.updated_at && isWithinInterval(parseISO(l.updated_at), { start: weekStart, end: weekEnd })
    );
    return { ...emp, weeklySuccess: weeklyLeads.length, total: leads.filter(l => matchEmployee(l.assigned_to, emp.user_id)).length };
  })
    .filter(e => e.weeklySuccess > 0)
    .sort((a, b) => b.weeklySuccess === a.weeklySuccess ? b.total - a.total : b.weeklySuccess - a.weeklySuccess)
    .slice(0, 5);

  const topPerformerCount = employeePerformance.filter(e => e.converted > 0).length;

  // Get recent leads
  const recentLeads = [...leads]
    .filter(l => l.updated_at)
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || 0).getTime();
      const dateB = new Date(b.updated_at || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Welcome back, {user?.name}! Here's your team's overview.</p>
          </div>
        </div>

        {/* Stats Cards with staggered animation */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          <StatsCard
            title="Total Employees"
            value={employees.length}
            icon={Users}
            iconClassName="bg-gradient-to-br from-blue-500 to-blue-600"
            delay={0}
            link="/admin/employees"
          />
          <StatsCard
            title="Active Team"
            value={activeEmployeeCount}
            icon={UserCheck}
            iconClassName="bg-gradient-to-br from-amber-500 to-amber-600"
            delay={100}
            link="/admin/employees"
          />
          <StatsCard
            title="Total Leads"
            value={totalLeads}
            icon={FileSpreadsheet}
            iconClassName="bg-gradient-to-br from-purple-500 to-purple-600"
            delay={150}
            link="/admin/leads"
          />
          <StatsCard
            title="Registration"
            value={registrationDone}
            icon={CreditCard}
            iconClassName="bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20"
            delay={200}
            link="/admin/leads?payment_stage=registration_done"
          />
          <StatsCard
            title="Initial Paid"
            value={initialPaymentDone}
            icon={CreditCard}
            iconClassName="bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/20"
            delay={250}
            link="/admin/leads?payment_stage=initial_payment_done"
          />
          <StatsCard
            title="Full Paid"
            value={fullPaymentDone}
            icon={CheckCircle}
            iconClassName="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20"
            delay={300}
            link="/admin/leads?payment_stage=full_payment_done"
          />
          <StatsCard
            title="Conversion"
            value={`${conversionRate}%`}
            icon={TrendingUp}
            trend={{ value: conversionRate, isPositive: conversionRate > 0 }}
            iconClassName="bg-gradient-to-br from-teal-500 to-teal-600"
            delay={350}
            link="/admin/leads"
          />
          <div className="cursor-pointer" onClick={() => document.getElementById('top-performers-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <StatsCard
              title="Success Stories"
              value={successLeads}
              icon={Star}
              iconClassName="bg-gradient-to-br from-rose-500 to-rose-600"
              delay={400}
            />
          </div>
        </div>


        {/* Domain-wise Payment Stats */}
        <Card className="border-border/50 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/30 dark:to-slate-900/20 animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Full Payment by Domain</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-center">
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{itPaidCount}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">IT</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-center">
                <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{nonItPaidCount}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Non-IT</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-center">
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{bankingPaidCount}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Banking</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lead Status Distribution */}
          <Card className="border-border/50 overflow-hidden group hover:shadow-lg transition-all duration-500 hover:border-primary/20 animate-slide-up stagger-1">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Lead Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {statusDistribution.map((status, index) => {
                  const percentage = totalLeads > 0 ? (status.count / totalLeads) * 100 : 0;
                  return (
                    <div
                      key={status.value}
                      className="group/item cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium group-hover/item:text-primary transition-colors">{status.label}</span>
                        <span className="text-sm text-muted-foreground font-mono">{status.count}</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000 ease-out",
                            status.color || "bg-gradient-to-r from-primary to-primary/70"
                          )}
                          style={{
                            width: `${percentage}%`,
                            transitionDelay: `${index * 100}ms`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers (All Time) */}
          <Card id="top-performers-section" className="border-border/50 overflow-hidden group hover:shadow-lg transition-all duration-500 hover:border-primary/20 animate-slide-up stagger-2">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Top Performers
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">All-time conversions ranking</p>
                </div>
                <div onClick={() => navigate('/admin/employees')}>
                  <Button variant="ghost" size="sm" className="gap-1 group/btn">
                    View All
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {employeePerformance.filter(e => e.converted > 0).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No conversions yet</p>
                ) : employeePerformance.filter(e => e.converted > 0).map((emp, index) => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer group/emp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                      index === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30" :
                        index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700" :
                          index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" :
                            "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md group-hover/emp:shadow-lg group-hover/emp:scale-105 transition-all duration-300">
                      <span className="text-sm font-bold text-white">{emp.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate group-hover/emp:text-primary transition-colors">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.total} leads • {emp.successCount} success</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-success">
                        <Trophy className="h-5 w-5" />
                        <span className="text-xl font-bold">{emp.converted}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">conversions</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Top Performers */}
          <Card className="border-border/50 overflow-hidden group hover:shadow-lg transition-all duration-500 hover:border-primary/20 animate-slide-up stagger-2">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Weekly Top Performers
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Week of {weekLabel}</p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {weeklyPerformance.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No conversions this week yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{weekLabel}</p>
                  </div>
                ) : weeklyPerformance.map((emp, index) => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer group/emp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                      index === 0 ? "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/30" :
                        index === 1 ? "bg-gradient-to-br from-emerald-300 to-emerald-400 text-emerald-800" :
                          index === 2 ? "bg-gradient-to-br from-teal-400 to-teal-600 text-white" :
                            "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md group-hover/emp:shadow-lg group-hover/emp:scale-105 transition-all duration-300">
                      <span className="text-sm font-bold text-white">{emp.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate group-hover/emp:text-primary transition-colors">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">This week's conversions</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-green-600">
                        <Star className="h-5 w-5" />
                        <span className="text-xl font-bold">{emp.weeklySuccess}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">this week</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-border/50 overflow-hidden hover:shadow-lg transition-all duration-500 animate-slide-up stagger-3">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Recent Activity
              </CardTitle>
              <div onClick={() => navigate('/admin/leads')}>
                <Button variant="ghost" size="sm" className="gap-1 group/btn">
                  View All Leads
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {recentLeads.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              ) : recentLeads.map((lead, index) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] group/lead"
                  onClick={() => setViewingLead(lead)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover/lead:bg-primary/20 transition-colors">
                    <span className="text-sm font-bold text-primary">{lead.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate group-hover/lead:text-primary transition-colors">{lead.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{lead.candidate_id}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    STATUS_OPTIONS.find(s => s.value === lead.status)?.color || "bg-muted"
                  )}>
                    {STATUS_OPTIONS.find(s => s.value === lead.status)?.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(safeParseDate(lead.updated_at), 'dd/MM/yyyy')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leave Requests Management */}
        <AdminLeaveRequests />
      </div>

      {/* View Lead Dialog */}
      {viewingLead && (
        <LeadFormDialog
          open={!!viewingLead}
          onOpenChange={(open) => !open && setViewingLead(null)}
          lead={viewingLead}
          mode="view"
          onSave={refetchLeads}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;