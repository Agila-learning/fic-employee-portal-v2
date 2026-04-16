import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, Shield, Key, ExternalLink, 
  MoreVertical, Edit, Trash2, FileText, ChevronRight,
  Database, Server, Globe, Lock, Cpu, Cloud, Mail
} from 'lucide-react';
import { credentialService, CredentialProject } from '@/api/credentialService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import CredentialProjectDialog from '@/components/credentials/CredentialProjectDialog';
import ProjectCredentialsView from '@/components/credentials/ProjectCredentialsView';

const STATUS_COLORS: Record<string, string> = {
  'Active': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'On Hold': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Completed': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Archived': 'bg-slate-500/10 text-slate-600 border-slate-500/20'
};

const CredentialsManager = () => {
    const [projects, setProjects] = useState<CredentialProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedProject, setSelectedProject] = useState<CredentialProject | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<CredentialProject | null>(null);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const data = await credentialService.getProjects();
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch projects', error);
            toast.error('Failed to load credential projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.projectName.toLowerCase().includes(search.toLowerCase()) || 
                             p.clientName?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleView = async (id: string) => {
        try {
            const fullProject = await credentialService.getProject(id);
            setSelectedProject(fullProject);
            setIsViewOpen(true);
        } catch (error) {
            toast.error('Failed to load project details');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project and all its credentials? This cannot be undone.')) return;
        try {
            await credentialService.deleteProject(id);
            toast.success('Project deleted');
            fetchProjects();
        } catch (error) {
            toast.error('Failed to delete project');
        }
    };

    return (
        <DashboardLayout requiredRole="admin">
            <div className="space-y-6 md:space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            Credentials Manager
                        </h1>
                        <p className="text-muted-foreground mt-1">Secure project vault for credentials and requirements</p>
                    </div>
                    <Button 
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/20 gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add New Project
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-card/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by project or client name..." 
                            className="pl-10 bg-transparent"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-transparent">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="On Hold">On Hold</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-[200px] rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <Card className="border-dashed border-2 py-12">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Key className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold">No projects found</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm">
                                Start by adding project credentials to keep them organized and secure.
                            </p>
                            <Button variant="outline" className="mt-6" onClick={() => setIsCreateDialogOpen(true)}>
                                Add Your First Project
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredProjects.map((project) => (
                                <motion.div
                                    key={project._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="group"
                                >
                                    <Card 
                                        className="h-full border-border/50 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer overflow-hidden relative"
                                        onClick={() => handleView(project._id!)}
                                    >
                                        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors font-bold truncate">
                                                        {project.projectName}
                                                    </CardTitle>
                                                    <CardDescription className="truncate">
                                                        {project.clientName || 'No Client'}
                                                    </CardDescription>
                                                </div>
                                                <Badge className={cn("shrink-0", STATUS_COLORS[project.status])}>
                                                    {project.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-5 space-y-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Credentials</span>
                                                <span className="font-bold flex items-center gap-1.5">
                                                    <Lock className="h-3.5 w-3.5 text-indigo-500" />
                                                    {(project as any).credentialCount || project.credentials.length} entries
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Category</span>
                                                <Badge variant="outline" className="font-normal border-border">
                                                    {project.department || 'General'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Last Updated</span>
                                                <span>{project.updatedAt ? format(new Date(project.updatedAt), 'MMM d, yyyy') : 'Recently'}</span>
                                            </div>

                                            <div className="flex items-center justify-end gap-2 pt-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-muted-foreground hover:text-indigo-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setProjectToEdit(project);
                                                        setIsCreateDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(project._id!);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="p-1 rounded-full bg-indigo-500/10 text-indigo-600 group-hover:translate-x-1 transition-transform ml-2">
                                                    <ChevronRight className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <CredentialProjectDialog 
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                    setIsCreateDialogOpen(open);
                    if (!open) setProjectToEdit(null);
                }}
                project={projectToEdit}
                onSuccess={fetchProjects}
            />

            {selectedProject && (
                <ProjectCredentialsView 
                    open={isViewOpen}
                    onOpenChange={setIsViewOpen}
                    project={selectedProject}
                    onUpdate={fetchProjects}
                />
            )}
        </DashboardLayout>
    );
};

export default CredentialsManager;
