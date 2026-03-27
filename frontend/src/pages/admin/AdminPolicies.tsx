import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { policyService } from '@/api/policyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ShieldCheck, FileText, Download, ExternalLink, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Policy {
  _id: string;
  title: string;
  description: string;
  type: 'company' | 'hr';
  file_url?: string;
  is_active: boolean;
  createdAt: string;
}

const AdminPolicies = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'company' as 'company' | 'hr',
    file_url: ''
  });

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await policyService.getPolicies();
      setPolicies(data);
    } catch (error) {
      toast.error('Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.type) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await policyService.createPolicy(formData);
      toast.success('Policy created successfully');
      setOpen(false);
      setFormData({ title: '', description: '', type: 'company', file_url: '' });
      fetchPolicies();
    } catch (error) {
      toast.error('Failed to create policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;
    try {
      await policyService.deletePolicy(id);
      toast.success('Policy deleted');
      fetchPolicies();
    } catch (error) {
      toast.error('Failed to delete policy');
    }
  };

  const getPolicyIcon = (type: string) => {
    return type === 'hr' ? <Users className="h-5 w-5 text-blue-500" /> : <ShieldCheck className="h-5 w-5 text-amber-500" />;
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary" /> Policies Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage Company and HR Policies</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Policy</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Policy Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Leave Policy 2026"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Policy Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: 'company' | 'hr') => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company Policy</SelectItem>
                      <SelectItem value="hr">HR Policy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Briefly describe the policy..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file_url">Policy Link (URL)</Label>
                  <Input
                    id="file_url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Policy'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" /> Company Policies
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
              ) : policies.filter(p => p.type === 'company').length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No company policies found</p>
              ) : (
                <div className="space-y-4">
                  {policies.filter(p => p.type === 'company').map((policy) => (
                    <PolicyItem key={policy._id} policy={policy} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" /> HR Policies
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
              ) : policies.filter(p => p.type === 'hr').length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No HR policies found</p>
              ) : (
                <div className="space-y-4">
                  {policies.filter(p => p.type === 'hr').map((policy) => (
                    <PolicyItem key={policy._id} policy={policy} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

const PolicyItem = ({ policy, onDelete }: { policy: Policy, onDelete: (id: string) => void }) => {
  return (
    <div className="group p-4 rounded-xl border border-border/40 bg-background/40 hover:bg-background/60 hover:dark:bg-slate-900/40 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            {getPolicyIcon(policy.type)}
            {policy.title}
          </h4>
          {policy.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{policy.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              Added: {format(parseISO(policy.createdAt), 'dd MMM yyyy')}
            </span>
            {policy.file_url && (
              <a 
                href={policy.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" /> View Policy
              </a>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(policy._id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AdminPolicies;
