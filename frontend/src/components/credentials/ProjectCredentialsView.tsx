import { useState } from 'react';
import { 
  X, Shield, Lock, Globe, Mail, Phone, User, 
  Terminal, Info, FileStack, ExternalLink, Copy, Eye, EyeOff,
  Calendar, CheckCircle, Clock, Download, FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CredentialProject, CredentialEntry } from '@/api/credentialService';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProjectCredentialsViewProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: CredentialProject;
    onUpdate: () => void;
}

const ProjectCredentialsView = ({ open, onOpenChange, project }: ProjectCredentialsViewProps) => {
    const [revealedPasswords, setRevealedPasswords] = useState<Record<number, boolean>>({});

    const togglePassword = (index: number) => {
        setRevealedPasswords(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied!`, { duration: 1500 });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none rounded-2xl shadow-2xl">
                {/* Header Banner */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white relative">
                    <div className="absolute top-4 right-4 flex gap-2">
                         <Badge className={cn("px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-lg", 
                             project.status === 'Active' ? 'bg-emerald-500 text-white border-none' : 'bg-slate-700 text-slate-300 border-slate-600')}>
                             {project.status}
                         </Badge>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                             <div className="flex items-center gap-3">
                                 <div className="p-3 rounded-2xl bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30">
                                     <Shield className="h-8 w-8 text-indigo-400" />
                                 </div>
                                 <div>
                                     <h2 className="text-3xl font-extrabold tracking-tight">{project.projectName}</h2>
                                     <p className="text-slate-400 font-medium flex items-center gap-2">
                                         {project.clientName || 'Unknown Client'} {project.companyName ? `• ${project.companyName}` : ''}
                                     </p>
                                 </div>
                             </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-400 bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-white/5">
                            <div className="text-center px-4 border-r border-white/10">
                                <p className="uppercase font-bold text-[10px] text-slate-500 mb-1">Created On</p>
                                <p className="text-slate-200 font-semibold">{project.createdAt ? format(new Date(project.createdAt), 'MMM d, yyyy') : 'N/A'}</p>
                            </div>
                            <div className="text-center px-4 border-r border-white/10">
                                <p className="uppercase font-bold text-[10px] text-slate-500 mb-1">Category</p>
                                <p className="text-slate-200 font-semibold">{project.department || 'General'}</p>
                            </div>
                            <div className="text-center px-4">
                                <p className="uppercase font-bold text-[10px] text-slate-500 mb-1">Logins</p>
                                <p className="text-indigo-400 font-bold underline decoration-indigo-500/50">{project.credentials.length} entries</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    {/* Sidebar / Requirements */}
                    <div className="lg:col-span-4 p-8 border-r border-border/50 bg-muted/20">
                        <div className="space-y-8">
                            <section className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Terminal className="h-4 w-4" /> Requirements & Scope
                                </h3>
                                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-border shadow-sm">
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80 font-medium">
                                        {project.requirements || 'No specific requirements documented yet for this project.'}
                                    </p>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <FileStack className="h-4 w-4" /> Attached Documents
                                </h3>
                                <div className="space-y-3">
                                    {project.attachments.length === 0 ? (
                                        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-border/50 text-muted-foreground">
                                            <p className="text-xs font-medium italic">No attachments found.</p>
                                        </div>
                                    ) : (
                                        project.attachments.map((file, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50 hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer group">
                                                <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    {file.type?.includes('pdf') ? 'PDF' : <FileText className="h-5 w-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate">{file.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{format(new Date(file.uploadDate), 'MMM d, yyyy')}</p>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(file.url, '_blank')}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Main Credentials Area */}
                    <div className="lg:col-span-8 p-8 bg-background">
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Lock className="h-4 w-4 text-indigo-500" /> Active Credentials
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-6">
                                {project.credentials.map((cred, index) => (
                                    <div 
                                        key={index}
                                        className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 relative group"
                                    >
                                        <div className="p-5 border-b border-border/50 bg-muted/10 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600">
                                                    {cred.loginType?.includes('Email') ? <Mail className="h-5 w-5" /> : 
                                                     cred.loginType?.includes('Username') ? <User className="h-5 w-5" /> : 
                                                     <KeyRound className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg text-foreground leading-none">{cred.title}</h4>
                                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 hover:text-indigo-500 cursor-pointer font-bold transition-colors">
                                                        {cred.role || 'Super Admin'} Access
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {cred.url && (
                                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-2 rounded-full border-blue-200 hover:bg-blue-50 text-blue-600" onClick={() => window.open(cred.url, '_blank')}>
                                                        Open Portal <ExternalLink className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-1.5 peer">
                                                    <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Username / ID</p>
                                                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 border border-transparent hover:border-indigo-500/20 hover:bg-white transition-all">
                                                        <span className="text-sm font-semibold truncate flex-1">{cred.username || cred.email || 'N/A'}</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(cred.username || cred.email || '', 'Username')}>
                                                            <Copy className="h-3.5 w-3.5 text-slate-400" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Secret Password</p>
                                                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 hover:bg-white transition-all relative overflow-hidden">
                                                        <span className={cn("text-sm font-bold flex-1 tracking-wider transition-all duration-300", !revealedPasswords[index] && "blur-sm select-none")}>
                                                            {revealedPasswords[index] ? cred.password : '••••••••••••'}
                                                        </span>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => togglePassword(index)}>
                                                                {revealedPasswords[index] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(cred.password, 'Password')}>
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                 <div className="space-y-1.5">
                                                     <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Additional Info</p>
                                                     <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 min-h-[100px]">
                                                         <p className="text-xs text-slate-600 italic leading-relaxed whitespace-pre-line">
                                                             {cred.notes || 'No specific notes for this credential.'}
                                                         </p>
                                                         {cred.recoveryMail && (
                                                             <div className="mt-2 pt-2 border-t border-slate-200">
                                                                 <p className="text-[10px] font-bold text-slate-400 uppercase">Recovery</p>
                                                                 <p className="text-[11px] font-semibold text-indigo-600 truncate">{cred.recoveryMail}</p>
                                                             </div>
                                                         )}
                                                     </div>
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProjectCredentialsView;
