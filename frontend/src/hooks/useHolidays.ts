import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { utilityService } from '@/api/utilityService';

export type HolidayType = 'public' | 'optional';

export interface Holiday {
  id: string;
  date: string;
  name: string;
  type: HolidayType;
  created_at: string;
  created_by: string;
}

export const useHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const data = await utilityService.getHolidays();
      setHolidays(data.map((h: any) => ({ ...h, id: h._id })));
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const addHoliday = async (date: string, name: string, type: HolidayType) => {
    if (!user || user.role !== 'admin') {
      toast({ title: 'Error', description: 'Unauthorized', variant: 'destructive' });
      return { error: new Error('Unauthorized') };
    }

    try {
      await utilityService.createHoliday({ date, name, type });
      toast({ title: 'Success', description: 'Holiday added successfully' });
      fetchHolidays();
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to add holiday', variant: 'destructive' });
      return { error };
    }
  };

  const deleteHoliday = async (id: string) => {
    if (!user || user.role !== 'admin') {
      toast({ title: 'Error', description: 'Unauthorized', variant: 'destructive' });
      return { error: new Error('Unauthorized') };
    }

    try {
      // Note: delete method not yet in utilityService
      toast({ title: 'Delete functionality not yet migrated' });
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const isHoliday = (date: string): Holiday | null => {
    return holidays.find(h => h.date === date) || null;
  };

  const isSunday = (date: Date | string): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.getDay() === 0;
  };

  const getDateStatus = (date: string): { type: 'sunday' | 'holiday' | 'working'; holiday?: Holiday } => {
    const d = new Date(date);
    if (isSunday(d)) {
      return { type: 'sunday' };
    }
    const holiday = isHoliday(date);
    if (holiday) {
      return { type: 'holiday', holiday };
    }
    return { type: 'working' };
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  return {
    holidays,
    loading,
    fetchHolidays,
    addHoliday,
    deleteHoliday,
    isHoliday,
    isSunday,
    getDateStatus
  };
};
