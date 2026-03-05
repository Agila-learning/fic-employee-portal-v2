import { useState, useEffect } from 'react';
import { Lead, LeadComment, LeadStatusHistory, LeadStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LeadSchema, validateInput, CommentSchema } from '@/utils/validation';
import { leadService } from '@/api/leadService';

// Audit logging function (adapted for new backend)
const logLeadAccess = async (
  userId: string,
  leadId: string | null,
  action: 'view' | 'create' | 'update' | 'delete' | 'export',
  accessedFields?: string[]
) => {
  try {
    await leadService.logAccess({
      user_id: userId,
      lead_id: leadId,
      action,
      accessed_fields: accessedFields || null,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[DEV] Audit log error:', error);
    }
  }
};

export const useLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeads = async () => {
    if (!user) return;

    try {
      const data = await leadService.getLeads();

      // Log for audit
      if (data && data.length > 0) {
        for (const lead of data.slice(0, 5)) {
          logLeadAccess(user.id, lead._id, 'view', ['name', 'status']);
        }
      }

      const mappedLeads = data.map((l: any) => ({
        ...l,
        id: l._id,
        created_at: l.createdAt || l.created_at,
        updated_at: l.updatedAt || l.updated_at,
        created_by_name: l.created_by?.name || 'Unknown'
      }));

      setLeads(mappedLeads);
    } catch (error: any) {
      toast.error('Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const addLead = async (leadData: Partial<Lead>) => {
    if (!user) return null;

    const validation = validateInput(LeadSchema, leadData);
    if (!validation.success) {
      toast.error(validation.error);
      return null;
    }

    try {
      const data = await leadService.createLead(validation.data);
      const newLead = { ...data, id: data._id };
      setLeads((prev) => [newLead, ...prev]);
      logLeadAccess(user.id, data._id, 'create', ['all']);
      return newLead;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add lead');
      return null;
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>, oldStatus?: LeadStatus) => {
    if (!user) return false;

    try {
      const data = await leadService.updateLead(id, updates);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...data, id: data._id } : l)));
      logLeadAccess(user.id, id, 'update', Object.keys(updates));
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update lead');
      return false;
    }
  };

  const deleteLead = async (id: string) => {
    if (!user) return false;

    try {
      await leadService.deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      logLeadAccess(user.id, id, 'delete', ['all']);
      return true;
    } catch (error: any) {
      toast.error('Failed to delete lead');
      return false;
    }
  };

  const bulkUpload = async (file: File) => {
    try {
      setIsLoading(true);
      const data = await leadService.bulkUploadLeads(file);
      toast.success(data.message || 'Leads uploaded successfully');
      await fetchLeads();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to bulk upload leads');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    leads,
    isLoading,
    addLead,
    updateLead,
    deleteLead,
    bulkUpload,
    // Include leads created_by OR assigned_to the employee
    getLeadsByEmployee: (empId: string) => leads.filter(l =>
      l.assigned_to === empId ||
      (typeof l.created_by === 'string' ? l.created_by === empId : (l.created_by as any)?._id === empId)
    ),
    refetchLeads: fetchLeads,
  };
};

export const useLeadComments = (leadId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const data = await leadService.getComments(leadId);
      setComments(data.map((c: any) => ({
        ...c,
        id: c._id,
        created_at: c.createdAt || c.created_at
      })));
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchComments();
  }, [leadId]);

  const addComment = async (comment: string) => {
    if (!user) return null;
    try {
      const data = await leadService.addComment(leadId, comment);
      const newComment = { ...data, id: data._id, user_name: user.name };
      setComments((prev) => [newComment, ...prev]);
      return newComment;
    } catch (error) {
      toast.error('Failed to add comment');
      return null;
    }
  };

  return { comments, isLoading, addComment, refetchComments: fetchComments };
};

export const useLeadStatusHistory = (leadId: string) => {
  const [history, setHistory] = useState<LeadStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const data = await leadService.getStatusHistory(leadId);
      setHistory(data.map((h: any) => ({
        ...h,
        id: h._id,
        created_at: h.createdAt || h.created_at
      })));
    } catch (error) {
      console.error('Error fetching status history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchHistory();
  }, [leadId]);

  return { history, isLoading, refetchHistory: fetchHistory };
};
