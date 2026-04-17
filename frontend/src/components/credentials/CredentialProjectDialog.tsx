import { useState, useEffect } from 'react';
import { 
  Plus, X, Shield, Lock, Globe, Mail, Phone, User, 
  Terminal, Server, Info, FileStack, PlusCircle, Trash2,
  KeyRound, ChevronDown, ChevronUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import { credentialService, CredentialProject, CredentialEntry } from '@/api/credentialService';
import { cn } from '@/lib/utils';

interface CredentialProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project?: CredentialProject | null;
    onSuccess: () => void;
}

const EMPTY_CREDENTIAL: Partial<CredentialEntry> = {
    title: '',
    loginType: 'Email login',
    email: '',
    mobile: '',
    username: '',
    password: '',
    url: '',
    role: 'Admin',
    notes: '',
};

const CredentialProjectDialog = ({ open, onOpenChange, project, onSuccess }: CredentialProjectDialogProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<CredentialProject>>({
        projectName: '',
        clientName: '',
        companyName: '',
        projectType: '',
        department: '',
        status: 'Active',
        developerName: '',
        requirements: '',
        credentials: [{ ...EMPTY_CREDENTIAL } as any]
    });

    useEffect(() => {
        if (project && open) {
            setFormData({
                ...project,
                credentials: project.credentials.length > 0 
                    ? project.credentials.map(c => ({ ...c })) 
                    : [{ ...EMPTY_CREDENTIAL } as any]
            });
        } else if (open) {
            setFormData({
                projectName: '',
                clientName: '',
                companyName: '',
                projectType: '',
                department: '',
                status: 'Active',
                developerName: '',
                requirements: '',
                credentials: [{ ...EMPTY_CREDENTIAL } as any]
            });
        }
    }, [project, open]);

    const handleAddCredential = () => {
        setFormData(prev => ({
            ...prev,
            credentials: [...(prev.credentials || []), { ...EMPTY_CREDENTIAL } as any]
        }));
    };

    const handleRemoveCredential = (index: number) => {
        if ((formData.credentials?.length || 0) <= 1) {
            toast.error('At least one credential entry is required');
            return;
        }
        const newCreds = [...(formData.credentials || [])];
        newCreds.splice(index, 1);
        setFormData(prev => ({ ...prev, credentials: newCreds }));
    };

    const handleCredentialChange = (index: number, field: string, value: any) => {
        const newCreds = [...(formData.credentials || [])];
        newCreds[index] = { ...newCreds[index], [field]: value };
        setFormData(prev => ({ ...prev, credentials: newCreds }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.projectName) {
            toast.error('Project Name is required');
            return;
        }

        // Validate credentials
        const invalid = formData.credentials?.some(c => !c.title || !c.password);
        if (invalid) {
            toast.error('All credentials must have a title and password');
            return;
        }

        setIsSubmitting(true);
        try {
            if (project?._id) {
                await credentialService.updateProject(project._id, formData);
                toast.success('Project credentials updated');
            } else {
                await credentialService.createProject(formData);
                toast.success('New project credentials added');
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save credentials');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto overflow-x-hidden p-0 gap-0 border-none rounded-2xl shadow-2xl">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white sticky top-0 z-10 shadow-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-md">
                                <Shield className="h-6 w-6" />
                            </div>
                            {project ? 'Edit Project Vault' : 'New Project Credential Vault'}
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100">
                            Securely store and manage all project-related access details.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8 bg-background/50 backdrop-blur-xl">
                    {/* Basic Info */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                            <Info className="h-4 w-4 text-indigo-500" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Basic Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Project Name *</Label>
                                <Input 
                                    value={formData.projectName} 
                                    onChange={e => setFormData(p => ({ ...p, projectName: e.target.value }))}
                                    placeholder="e.g., Global E-Commerce Portal"
                                    className="bg-card/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Client / Company Name</Label>
                                <Input 
                                    value={formData.clientName} 
                                    onChange={e => setFormData(p => ({ ...p, clientName: e.target.value }))}
                                    placeholder="e.g., Acme Corp / John Doe"
                                    className="bg-card/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Project Category / Department</Label>
                                <Input 
                                    value={formData.department} 
                                    onChange={e => setFormData(p => ({ ...p, department: e.target.value }))}
                                    placeholder="e.g., IT, Marketing, Banking"
                                    className="bg-card/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Developer Name</Label>
                                <Input 
                                    value={formData.developerName} 
                                    onChange={e => setFormData(p => ({ ...p, developerName: e.target.value }))}
                                    placeholder="Builder/Developer Name"
                                    className="bg-card/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as any }))}>
                                    <SelectTrigger className="bg-card/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="On Hold">On Hold</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </section>

                    {/* Requirements */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                            <Terminal className="h-4 w-4 text-indigo-500" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Required Functionalities & Scope</h3>
                        </div>
                        <div className="space-y-2">
                            <Textarea 
                                value={formData.requirements} 
                                onChange={e => setFormData(p => ({ ...p, requirements: e.target.value }))}
                                placeholder="Describe project modules, scope, specific features required..."
                                className="min-h-[120px] bg-card/50 focus:ring-indigo-500"
                            />
                        </div>
                    </section>

                    {/* Credentials */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-indigo-500" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Logins & Credentials</h3>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddCredential} className="h-7 gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                <PlusCircle className="h-3.5 w-3.5" /> Add Dashboard
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {formData.credentials?.map((cred, index) => (
                                <div key={index} className="relative group p-6 rounded-xl border border-border/50 bg-gradient-to-br from-card to-muted/20 hover:border-indigo-500/30 transition-all duration-300">
                                    <div className="absolute -top-3 left-4 px-2 bg-background text-[10px] font-bold text-indigo-600 uppercase tracking-widest border rounded">
                                        Credential #{index + 1}
                                    </div>
                                    
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-600" onClick={() => handleRemoveCredential(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label className="text-xs">Dashboard Name / Title *</Label>
                                            <Input 
                                                value={cred.title} 
                                                onChange={e => handleCredentialChange(index, 'title', e.target.value)}
                                                placeholder="e.g., Admin Dashboard, Database Login, Cloud Console"
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Login Type</Label>
                                            <Select value={cred.loginType} onValueChange={v => handleCredentialChange(index, 'loginType', v)}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Email login">Email login</SelectItem>
                                                    <SelectItem value="Mobile login">Mobile login</SelectItem>
                                                    <SelectItem value="Username login">Username login</SelectItem>
                                                    <SelectItem value="Custom login">Custom login</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Username / ID</Label>
                                            <div className="relative">
                                                <User className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input 
                                                    value={cred.username} 
                                                    onChange={e => handleCredentialChange(index, 'username', e.target.value)}
                                                    className="pl-8 h-9"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Email ID</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input 
                                                    value={cred.email} 
                                                    onChange={e => handleCredentialChange(index, 'email', e.target.value)}
                                                    className="pl-8 h-9"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Password *</Label>
                                            <div className="relative">
                                                <KeyRound className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input 
                                                    type="password"
                                                    value={cred.password} 
                                                    onChange={e => handleCredentialChange(index, 'password', e.target.value)}
                                                    className="pl-8 h-9"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label className="text-xs">Dashboard / Login URL</Label>
                                            <div className="relative">
                                                <Globe className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input 
                                                    value={cred.url} 
                                                    onChange={e => handleCredentialChange(index, 'url', e.target.value)}
                                                    className="pl-8 h-9"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Access Role</Label>
                                            <Input 
                                                value={cred.role} 
                                                onChange={e => handleCredentialChange(index, 'role', e.target.value)}
                                                className="h-9"
                                                placeholder="e.g. Super Admin"
                                            />
                                        </div>
                                    </div>
                                    
                                    <Accordion type="single" collapsible className="mt-4">
                                        <AccordionItem value="extra" className="border-none">
                                            <AccordionTrigger className="py-0 text-[10px] uppercase font-bold text-muted-foreground hover:no-underline">
                                                More Details (Recovery / Notes)
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase">Recovery Email</Label>
                                                    <Input className="h-8 text-xs" value={cred.recoveryMail} onChange={e => handleCredentialChange(index, 'recoveryMail', e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase">Mobile / Recovery Phone</Label>
                                                    <Input className="h-8 text-xs" value={cred.mobile} onChange={e => handleCredentialChange(index, 'mobile', e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5 md:col-span-2">
                                                    <Label className="text-[10px] uppercase">Notes</Label>
                                                    <Textarea className="min-h-[60px] text-xs" value={cred.notes} onChange={e => handleCredentialChange(index, 'notes', e.target.value)} />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            ))}
                        </div>
                    </section>

                    <DialogFooter className="sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 border-t border-border/50 z-20">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-indigo-700 min-w-[150px]" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                project ? 'Update Project' : 'Save Project Vault'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CredentialProjectDialog;
