import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useSuccessStories, SuccessStory } from '@/hooks/useSuccessStories';
import { Plus, Edit2, Trash2, Trophy, MapPin, Briefcase, Quote, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = { candidate_name: '', package: '', location: '', domain: '', motivation_words: '' };

const AdminSuccessStories = () => {
  const { stories, isLoading, addStory, updateStory, deleteStory } = useSuccessStories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => { setEditingStory(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (story: SuccessStory) => {
    setEditingStory(story);
    setForm({ candidate_name: story.candidate_name, package: story.package, location: story.location, domain: story.domain, motivation_words: story.motivation_words });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.candidate_name || !form.package || !form.location || !form.domain || !form.motivation_words) {
      toast.error('Please fill all fields');
      return;
    }
    if (editingStory) {
      await updateStory(editingStory.id, form);
    } else {
      await addStory(form);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteStory(id);
    setDeleteConfirm(null);
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" /> Success Stories
            </h1>
            <p className="text-muted-foreground">Manage placement success stories</p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Story
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : stories.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No success stories yet. Add one!</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map((story) => (
              <Card key={story.id} className="relative overflow-hidden border-border/50 hover:shadow-lg transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-foreground">{story.candidate_name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(story)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(story.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      <IndianRupee className="h-3 w-3" /> {story.package}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      <MapPin className="h-3 w-3" /> {story.location}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                      <Briefcase className="h-3 w-3" /> {story.domain}
                    </span>
                  </div>
                  <div className="relative pl-4 border-l-2 border-amber-400">
                    <Quote className="absolute -left-2.5 -top-1 h-5 w-5 text-amber-400 bg-card" />
                    <p className="text-sm text-muted-foreground italic leading-relaxed">{story.motivation_words}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStory ? 'Edit' : 'Add'} Success Story</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Candidate Name</label>
              <Input value={form.candidate_name} onChange={(e) => setForm({ ...form, candidate_name: e.target.value })} placeholder="e.g. Rahul Kumar" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Package (CTC)</label>
              <Input value={form.package} onChange={(e) => setForm({ ...form, package: e.target.value })} placeholder="e.g. 6 LPA" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Location</label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bangalore" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Domain</label>
              <Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="e.g. IT / Non-IT / Banking" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Motivation Words</label>
              <Textarea value={form.motivation_words} onChange={(e) => setForm({ ...form, motivation_words: e.target.value })} placeholder="Inspiring words from the candidate..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingStory ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Success Story?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminSuccessStories;
