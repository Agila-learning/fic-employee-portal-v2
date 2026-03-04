import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Attendance } from '@/hooks/useAttendance';

interface AttendanceEditDialogProps {
  attendance: Attendance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, status: 'present' | 'absent', leaveReason?: string, isHalfDay?: boolean) => Promise<{ error: Error | null }>;
}

const AttendanceEditDialog = ({ attendance, open, onOpenChange, onSave }: AttendanceEditDialogProps) => {
  const [status, setStatus] = useState<'present' | 'absent'>(attendance?.status || 'present');
  const [leaveReason, setLeaveReason] = useState(attendance?.leave_reason || '');
  const [isHalfDay, setIsHalfDay] = useState(attendance?.half_day || false);
  const [saving, setSaving] = useState(false);

  // Reset form when attendance changes
  useEffect(() => {
    if (attendance) {
      setStatus(attendance.status);
      setLeaveReason(attendance.leave_reason || '');
      setIsHalfDay(attendance.half_day || false);
    }
  }, [attendance]);

  const handleSave = async () => {
    if (!attendance) return;
    setSaving(true);
    const result = await onSave(attendance.id, status, leaveReason, isHalfDay);
    setSaving(false);
    if (!result.error) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Attendance</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <p className="text-sm font-medium text-foreground">{attendance?.user_name}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Date</Label>
            <p className="text-sm font-medium text-foreground">
              {attendance?.date && new Date(attendance.date).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={status === 'present' && !isHalfDay ? 'default' : 'outline'}
                onClick={() => { setStatus('present'); setIsHalfDay(false); }}
                className={status === 'present' && !isHalfDay ? 'bg-success hover:bg-success/90' : ''}
                size="sm"
              >
                Present
              </Button>
              <Button
                type="button"
                variant={status === 'present' && isHalfDay ? 'default' : 'outline'}
                onClick={() => { setStatus('present'); setIsHalfDay(true); }}
                className={status === 'present' && isHalfDay ? 'bg-warning hover:bg-warning/90' : ''}
                size="sm"
              >
                Half Day
              </Button>
              <Button
                type="button"
                variant={status === 'absent' ? 'default' : 'outline'}
                onClick={() => { setStatus('absent'); setIsHalfDay(false); }}
                className={status === 'absent' ? 'bg-destructive hover:bg-destructive/90' : ''}
                size="sm"
              >
                Absent
              </Button>
            </div>
          </div>

          {status === 'absent' && (
            <div className="space-y-2">
              <Label>Leave Reason *</Label>
              <Textarea
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Enter reason for leave..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceEditDialog;
