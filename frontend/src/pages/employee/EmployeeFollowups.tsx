import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { leadService } from '@/api/leadService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadFormDialog from '@/components/leads/LeadFormDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Search, Eye, Phone, MapPin, ExternalLink, Calendar as CalendarLucide } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Lead } from '@/types';
import LeadStatusBadge from '@/components/leads/LeadStatusBadge';

const EmployeeFollowups = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchFollowups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await leadService.getLeads();
      // Filter for current employee, status 'follow_up', and has followup_date
      const followups = (data || []).filter((l: any) =>
        (l.agent_id === user.id || l.user_id === user.id) &&
        l.status === 'follow_up' &&
        l.followup_date
      );
      // Sort by followup date
      followups.sort((a: any, b: any) => new Date(a.followup_date).getTime() - new Date(b.followup_date).getTime());
      setLeads(followups);
    } catch (error) {
      toast.error('Failed to fetch follow-ups');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.candidate_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.mobile_number.includes(searchTerm)
  );

  const getFollowupBadge = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return <Badge className="bg-amber-500 hover:bg-amber-600">Today</Badge>;
    if (isTomorrow(date)) return <Badge className="bg-blue-500 hover:bg-blue-600">Tomorrow</Badge>;
    if (isPast(date)) return <Badge variant="destructive">Overdue</Badge>;
    return <Badge variant="outline">{format(date, 'dd MMM')}</Badge>;
  };

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground font-heading">Follow-up List</h1>
          <p className="text-muted-foreground">Manage your scheduled follow-ups with candidates</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID or mobile..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg">Upcoming Follow-ups ({filteredLeads.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Candidate</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Latest Comment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filteredLeads.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No follow-ups found</TableCell></TableRow>
                  ) : filteredLeads.map((l) => (
                    <TableRow key={l.id || (l as any)._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{l.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{l.candidate_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {l.mobile_number}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {l.location || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {l.followup_date && getFollowupBadge(l.followup_date)}
                          <span className="text-xs text-muted-foreground">
                            {l.followup_date && format(parseISO(l.followup_date), 'PPP')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {l.comments || 'No comments'}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedLead(l)} className="gap-2 hover:bg-primary/10 hover:text-primary transition-colors">
                          <Eye className="h-4 w-4" /> View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedLead && (
        <LeadFormDialog
          open={!!selectedLead}
          onOpenChange={(open) => !open && setSelectedLead(null)}
          lead={selectedLead}
          mode="edit"
          onSave={fetchFollowups}
        />
      )}
    </DashboardLayout>
  );
};

export default EmployeeFollowups;
