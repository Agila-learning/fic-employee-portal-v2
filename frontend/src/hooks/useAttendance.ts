import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getCurrentLocation,
  isWithinLocation,
  getMinDistanceFromLocation,
  OFFICE_LOCATIONS,
  WorkLocation
} from '@/utils/geolocation';
import { operationService } from '@/api/operationService';

export type AttendanceStatus = 'present' | 'absent' | 'half_day';

export interface Attendance {
  _id?: string;
  id: string;
  user_id: string;
  date: string;
  status: 'present' | 'absent';
  marked_at: string;
  check_in?: string;
  check_out?: string;
  duration?: string;       // e.g. "8h 30m"
  duration_minutes?: number;
  leave_reason?: string | null;
  user_name?: string;
  half_day?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  location_verified?: boolean;
  work_location?: WorkLocation | null;
  notes?: string;
}

export interface AttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  totalHalfDays: number;
  currentMonthPresent: number;
  currentMonthAbsent: number;
  currentMonthHalfDays: number;
}

export const useAttendance = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [myAttendance, setMyAttendance] = useState<Attendance[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>({
    totalPresent: 0,
    totalAbsent: 0,
    totalHalfDays: 0,
    currentMonthPresent: 0,
    currentMonthAbsent: 0,
    currentMonthHalfDays: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAttendance = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch admin view if applicable
      if (user.role === 'admin') {
        const adminData = await operationService.getAllAttendance();
        setAttendance((adminData || []).map((a: any) => ({
          ...a,
          id: a._id || a.id,
          marked_at: a.check_in || a.createdAt || a.created_at || (a.date ? new Date(a.date).toISOString() : new Date().toISOString()),
          user_name: a.user_id?.name || 'Unknown'
        })));
      }

      // Fetch personal attendance
      const myData = await operationService.getMyAttendance();
      const mappedMyAttendance = (myData || []).map((a: any) => {
        let markedAt = a.check_in || a.createdAt || a.created_at;
        if (!markedAt && a.date) {
          try {
            markedAt = new Date(a.date).toISOString();
          } catch (e) {
            markedAt = new Date().toISOString();
          }
        }
        return {
          ...a,
          id: a._id || `virtual-${a.date || Math.random()}`,
          marked_at: markedAt || new Date().toISOString()
        };
      });
      setMyAttendance(mappedMyAttendance);

      // Calculate summary and find today's entry
      const today = new Date().toISOString().split('T')[0];
      const todayEntry = mappedMyAttendance.find((a: any) => a.date === today);
      setTodayAttendance(todayEntry || null);

      // (Summary calculation remains same as original)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const totalPresent = mappedMyAttendance.filter((a: any) => a.status === 'present' && !a.half_day).length;
      const totalAbsent = mappedMyAttendance.filter((a: any) => a.status === 'absent').length;
      const totalHalfDays = mappedMyAttendance.filter((a: any) => a.half_day === true).length;

      const currentMonthAttendance = mappedMyAttendance.filter((a: any) => {
        const date = new Date(a.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      const currentMonthPres = currentMonthAttendance.filter((a: any) => a.status === 'present' && !a.half_day).length;
      const currentMonthAbs = currentMonthAttendance.filter((a: any) => a.status === 'absent').length;
      const currentMonthHalf = currentMonthAttendance.filter((a: any) => a.half_day === true).length;

      setAttendanceSummary({
        totalPresent,
        totalAbsent,
        totalHalfDays,
        currentMonthPresent: currentMonthPres,
        currentMonthAbsent: currentMonthAbs,
        currentMonthHalfDays: currentMonthHalf
      });

    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error fetching attendance:', error);
      // Ensure we don't keep stale data on error
      setTodayAttendance(null);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (
    status: 'present' | 'absent',
    leaveReason?: string,
    workLocation?: WorkLocation,
    isHalfDay?: boolean,
    facePhotoData?: string
  ) => {
    if (!user) return { error: new Error('Not authenticated'), locationError: false };

    // Validations (same as original, keeping time restriction etc.)
    const now = new Date();
    const isLate = now.getHours() > 10 || (now.getHours() === 10 && now.getMinutes() >= 30);
    const isRestrictedLocation = workLocation === 'krishnagiri' || workLocation === 'chennai';

    if (isLate && isRestrictedLocation) {
      toast({ title: "Attendance window closed", description: "Attendance for Krishnagiri and Chennai can only be marked before 10:30 AM", variant: "destructive" });
      return { error: new Error('Attendance window closed'), locationError: false };
    }

    if (todayAttendance) {
      toast({ title: 'Already Marked', description: 'Already marked for today', variant: 'destructive' });
      return { error: new Error('Already marked'), locationError: false };
    }

    // GPS Verification (same as original)
    let latitude: number | undefined;
    let longitude: number | undefined;
    let locationVerified = false;

    if (status === 'present' && !isHalfDay && workLocation) {
      const selectedLocation = OFFICE_LOCATIONS[workLocation];
      if (selectedLocation.requiresGPS) {
        toast({ title: 'Checking Location', description: `Verifying address...` });
        const locationResult = await getCurrentLocation();
        if (!locationResult.success) {
          toast({ title: 'Location Required', description: locationResult.error || 'Access denied', variant: 'destructive' });
          return { error: new Error(locationResult.error || 'Location access required'), locationError: true };
        }
        if (!isWithinLocation(locationResult.latitude!, locationResult.longitude!, selectedLocation)) {
          return { error: new Error('Outside office premises'), locationError: true };
        }
        latitude = locationResult.latitude;
        longitude = locationResult.longitude;
        locationVerified = true;
      } else {
        locationVerified = true;
      }
    }

    try {
      const finalNotes = isLate ? (leaveReason ? `${leaveReason} (Late Login)` : '(Late Login)') : leaveReason;
      
      await operationService.markAttendance({
        date: new Date().toISOString().split('T')[0],
        status,
        leave_reason: status === 'absent' ? leaveReason : null,
        notes: finalNotes,
        latitude,
        longitude,
        location_verified: locationVerified,
        half_day: isHalfDay ?? false,
        work_location: workLocation || null,
        face_photo: facePhotoData // Backend will handle base64 or upload
      });

      toast({ title: 'Success', description: `Attendance marked` });
      fetchAttendance();
      return { error: null, locationError: false };
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to mark attendance', variant: 'destructive' });
      return { error, locationError: false };
    }
  };

  const checkOut = async (workLocation?: WorkLocation) => {
    if (!user) return { error: new Error('Not authenticated') };

    // GPS verification — same logic as check-in
    let latitude: number | undefined;
    let longitude: number | undefined;
    let locationVerified = false;

    if (workLocation) {
      const selectedLocation = OFFICE_LOCATIONS[workLocation];
      if (selectedLocation.requiresGPS) {
        toast({ title: 'Checking Location', description: 'Verifying your location for checkout...' });
        const locationResult = await getCurrentLocation();
        if (!locationResult.success) {
          toast({ title: 'Location Required', description: locationResult.error || 'Location access denied', variant: 'destructive' });
          return { error: new Error(locationResult.error || 'Location access required'), locationError: true };
        }
        if (!isWithinLocation(locationResult.latitude!, locationResult.longitude!, selectedLocation)) {
          toast({ title: 'Location Mismatch', description: 'You are not within the selected office location.', variant: 'destructive' });
          return { error: new Error('Outside office premises'), locationError: true };
        }
        latitude = locationResult.latitude;
        longitude = locationResult.longitude;
        locationVerified = true;
      } else {
        locationVerified = true;
      }
    }

    try {
      const result = await operationService.checkOut({ work_location: workLocation, latitude, longitude, location_verified: locationVerified });
      // Immediately update todayAttendance with check_out + duration
      setTodayAttendance(prev => prev ? {
        ...prev,
        check_out: result.check_out,
        duration: result.duration,
        duration_minutes: result.duration_minutes
      } : prev);
      toast({ title: '✅ Checked Out', description: `Duration: ${result.duration}` });
      fetchAttendance();
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to check out',
        variant: 'destructive'
      });
      return { error };
    }
  };

  // Admin function to update attendance
  const updateAttendance = async (id: string, status: 'present' | 'absent', leaveReason?: string, isHalfDay?: boolean) => {
    if (!user || user.role !== 'admin') {
      toast({ title: 'Error', description: 'Unauthorized', variant: 'destructive' });
      return { error: new Error('Unauthorized') };
    }
    try {
      await operationService.updateAttendance(id, { status, leave_reason: leaveReason, half_day: isHalfDay });
      toast({ title: 'Success', description: 'Attendance updated' });
      fetchAttendance();
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const adminMarkAttendance = async (empId: string, status: 'present' | 'absent', date: string, leaveReason?: string) => {
    if (!user || user.role !== 'admin') {
      toast({ title: 'Error', description: 'Unauthorized', variant: 'destructive' });
      return { error: new Error('Unauthorized') };
    }
    try {
      await operationService.markAttendance({
        user_id: empId,
        status,
        date,
        notes: leaveReason
      });
      toast({ title: 'Success', description: `Attendance marked manually` });
      fetchAttendance();
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to sync manual attendance', variant: 'destructive' });
      return { error };
    }
  };

  const canMarkAttendance = () => {
    return !todayAttendance;
  };

  useEffect(() => {
    if (user) fetchAttendance();
  }, [user]);

  return {
    attendance,
    myAttendance,
    todayAttendance,
    attendanceSummary,
    loading,
    fetchAttendance,
    markAttendance,
    checkOut,
    updateAttendance,
    adminMarkAttendance,
    canMarkAttendance
  };
};
