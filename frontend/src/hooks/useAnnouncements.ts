import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AnnouncementSchema, validateInput } from '@/utils/validation';
import { utilityService } from '@/api/utilityService';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await utilityService.getAnnouncements();
      setAnnouncements(data.map((a: any) => ({
        ...a,
        id: a._id,
        created_at: a.createdAt || a.created_at
      })));
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async (announcement: { title: string; message: string }) => {
    if (!user) return { error: new Error('Not authenticated') };

    const validation = validateInput(AnnouncementSchema, announcement);
    if (!validation.success) {
      toast({ title: 'Validation Error', description: validation.error, variant: 'destructive' });
      return { error: new Error(validation.error) };
    }

    try {
      await utilityService.createAnnouncement(validation.data);
      toast({ title: 'Success', description: 'Announcement posted successfully' });
      fetchAnnouncements();
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await utilityService.deleteAnnouncement(id);
      toast({ title: 'Success', description: 'Announcement deleted' });
      fetchAnnouncements();
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const toggleAnnouncementStatus = async (id: string, isActive: boolean) => {
    try {
      await utilityService.updateAnnouncementStatus(id, isActive);
      toast({ title: 'Success', description: `Announcement ${isActive ? 'activated' : 'deactivated'}` });
      fetchAnnouncements();
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  useEffect(() => {
    if (user) fetchAnnouncements();
  }, [user]);

  return { announcements, loading, fetchAnnouncements, createAnnouncement, deleteAnnouncement, toggleAnnouncementStatus };
};
