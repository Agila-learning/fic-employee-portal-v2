import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { utilityService } from '@/api/utilityService';
import apiClient from '@/api/apiClient';

export interface SuccessStory {
  id: string;
  candidate_name: string;
  package: string;
  location: string;
  domain: string;
  motivation_words: string;
  video_url?: string | null;
  video_path?: string | null;
  video_public_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useSuccessStories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const data = await utilityService.getSuccessStories();
      setStories(data.map((s: any) => ({ ...s, id: s._id, video_url: s.video_url || s.video_path })) || []);
    } catch (error: any) {
      toast.error('Failed to fetch success stories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchStories();
  }, [user]);

  const uploadVideo = async (file: File): Promise<string | null> => {
    try {
      // Step 1: Get a signed upload token from our backend (tiny JSON, no Vercel size limit)
      const sigResponse = await apiClient.post('/utility/cloudinary-signature', {
        folder: 'success-stories'
      });
      const { signature, timestamp, folder, api_key, cloud_name } = sigResponse.data;

      if (!cloud_name || !signature) {
        throw new Error('Upload service not configured. Please contact admin.');
      }

      // Step 2: Upload DIRECTLY from browser to Cloudinary (bypasses Vercel proxy entirely)
      // This avoids Vercel's 4.5MB/30s proxy limits for large video files
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`,
        { method: 'POST', body: formData }
      );

      if (!uploadResponse.ok) {
        const errData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Upload failed (${uploadResponse.status})`);
      }

      const uploadData = await uploadResponse.json();
      return uploadData.secure_url;
    } catch (error: any) {
      const msg = error.message || 'Upload failed';
      toast.error('Video upload failed: ' + msg);
      return null;
    }
  };

  const deleteVideoFile = async (videoPath: string) => {

    // For now, Cloudinary handles overwrites or we can add delete logic later
    console.log('Delete requested for:', videoPath);
  };

  const getVideoPublicUrl = (videoPath: string) => {
    // If it's already a full URL (Cloudinary returns full URL), return it
    return videoPath;
  };

  const addStory = async (story: Omit<SuccessStory, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) return;
    try {
      await utilityService.createSuccessStory(story);
      toast.success('Success story added!');
      fetchStories();
    } catch (error: any) {
      toast.error('Failed to add success story');
    }
  };

  const updateStory = async (id: string, updates: Partial<Omit<SuccessStory, 'id' | 'created_at' | 'created_by'>>) => {
    try {
      await utilityService.updateSuccessStory(id, updates);
      toast.success('Success story updated!');
      fetchStories();
      return true;
    } catch (error: any) {
      toast.error('Failed to update success story');
      return false;
    }
  };

  const deleteStory = async (id: string) => {
    try {
      await utilityService.deleteSuccessStory(id);
      toast.success('Success story deleted!');
      fetchStories();
      return true;
    } catch (error: any) {
      toast.error('Failed to delete success story');
      return false;
    }
  };

  return { stories, isLoading, addStory, updateStory, deleteStory, uploadVideo, deleteVideoFile, getVideoPublicUrl, refetch: fetchStories };
};
