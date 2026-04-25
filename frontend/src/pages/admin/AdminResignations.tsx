import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { resignationService } from '@/api/resignationService';
import { Resignation } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Eye, CheckCircle2, XCircle, ShieldCheck, DoorOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminResignations = () => {
  const { user } = useAuth();
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Resignation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchResignations();
  }, []);

  const fetchResignations = async () => {
    try {
      const data = await resignationService.getAllResignations();
      setResignations(data);
    } catch (error) {
      toast.error('Failed to load resignations');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status: string) => {
    if (!selectedItem) return;
    if (!remarks.trim()) {
      toast.error('Remarks are required for this action');
      return;
    }

    setProcessing(true);
    try {
      await resignationService.updateResignationStatus(selectedItem._id, status, remarks);
      toast.success(`Resignation marked as ${status}`);
      setIsModalOpen(false);
      fetchResignations();
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      if (selectedItem.status !== 'Notice Active' && selectedItem.status !== 'Clearance Pending') {
         await resignationService.updateResignationStatus(selectedItem._id, 'Clearance Pending', 'Auto moved to clearance before finalization');
      }
      await resignationService.finalizeResignation(selectedItem._id);
      toast.success('Exit process completed. Relieving letter sent.');
      setIsModalOpen(false);
      fetchResignations();
    } catch (error) {
      toast.error('Failed to finalize resignation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resignation request? This action cannot be undone.')) return;
    
    setProcessing(true);
    try {
      await resignationService.revokeResignation(id);
      toast.success('Resignation request deleted successfully');
      fetchResignations();
    } catch (error) {
      toast.error('Failed to delete resignation');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-100 text-blue-700';
      case 'HR Approved': return 'bg-purple-100 text-purple-700';
      case 'CEO Approved': return 'bg-indigo-100 text-indigo-700';
      case 'Notice Active': return 'bg-orange-100 text-orange-700';
      case 'Clearance Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Resignation Management</h1>
            <p className="text-sm text-slate-500 mt-2">Review and process employee resignations, notice periods, and clearance.</p>
          </div>
        </div>

        <Card className="rounded-2xl border-slate-200/60 shadow-lg shadow-slate-100/50 bg-white">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
            ) : resignations.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No resignations found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-xl">Employee</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Applied On</th>
                      <th className="px-6 py-4">Requested Last Day</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 rounded-tr-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resignations.map((res) => (
                      <tr key={res._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {res.employee?.name}
                          <div className="text-xs text-slate-500 font-normal">{res.employee?.employee_id}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{res.employee?.department}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(res.appliedDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(res.proposedLastWorkingDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(res.status)}>{res.status}</Badge>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(res); setIsModalOpen(true); setRemarks(''); }}>
                            <Eye className="w-4 h-4 mr-2 text-amber-500" /> View
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(res._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <DoorOpen className="text-amber-500" /> Resignation Details
              </DialogTitle>
            </DialogHeader>

            {selectedItem && (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Employee</span>
                    <p className="font-bold text-slate-800">{selectedItem.employee?.name}</p>
                    <p className="text-sm text-slate-600">{selectedItem.employee?.employee_id}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Status</span>
                    <div className="mt-1"><Badge className={getStatusColor(selectedItem.status)}>{selectedItem.status}</Badge></div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Reason</span>
                    <p className="text-sm text-slate-800 mt-1">{selectedItem.reason}</p>
                    {selectedItem.customReason && <p className="text-xs text-slate-600 italic mt-1">"{selectedItem.customReason}"</p>}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Dates</span>
                    <p className="text-sm text-slate-800 mt-1">Applied: {new Date(selectedItem.appliedDate).toLocaleDateString()}</p>
                    <p className="text-sm font-semibold text-amber-600 mt-0.5">Proposed Last Day: {new Date(selectedItem.proposedLastWorkingDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 font-semibold text-slate-700">Exit Survey & Feedback</div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <span className="font-semibold text-slate-700">Overall Experience</span>
                      <p className="text-slate-600 mt-1">{selectedItem.experience || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Challenges Faced</span>
                      <p className="text-slate-600 mt-1">{selectedItem.challenges || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Suggestions (Culture)</span>
                      <p className="text-slate-600 mt-1">{selectedItem.improveCulture || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Final Feedback</span>
                      <p className="text-slate-600 mt-1">{selectedItem.finalFeedback || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Actions Based on Role and Status */}
                {selectedItem.status !== 'Completed' && selectedItem.status !== 'Rejected' && (
                  <div className="space-y-4 p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
                    <h3 className="font-bold text-slate-800">Action Panel</h3>
                    <Textarea 
                      placeholder="Enter remarks for approval/rejection/clearance..." 
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="bg-white"
                    />
                    
                    <div className="flex gap-3 flex-wrap">
                      {/* HR Actions: Only if Submitted and not HR resigning (HR resignation goes to CEO) */}
                      {user?.role === 'hr_manager' && 
                       selectedItem.status === 'Submitted' && 
                       selectedItem.employee?.role !== 'hr_manager' && (
                        <>
                          <Button disabled={processing} onClick={() => handleAction('HR Approved')} className="bg-purple-600 hover:bg-purple-700">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> HR Approve
                          </Button>
                          <Button disabled={processing} variant="destructive" onClick={() => handleAction('Rejected')}>
                            <XCircle className="w-4 h-4 mr-2" /> Reject
                          </Button>
                        </>
                      )}

                      {/* Admin / CEO Actions */}
                      {(user?.role === 'admin' || user?.role === 'md') && (
                        <>
                          {/* CEO Approve: Only if HR Approved OR if applicant is HR Manager (skips HR step) */}
                          {((selectedItem.status === 'HR Approved') || 
                            (selectedItem.status === 'Submitted' && selectedItem.employee?.role === 'hr_manager')) && (
                            <>
                              <Button disabled={processing} onClick={() => handleAction('CEO Approved')} className="bg-indigo-600 hover:bg-indigo-700">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> CEO Approve
                              </Button>
                              <Button disabled={processing} variant="destructive" onClick={() => handleAction('Rejected')}>
                                <XCircle className="w-4 h-4 mr-2" /> Reject
                              </Button>
                            </>
                          )}
                          
                          {/* Fallback for CEO to approve Submitted directly if needed (e.g. bypass HR) */}
                          {selectedItem.status === 'Submitted' && selectedItem.employee?.role !== 'hr_manager' && (
                             <Button disabled={processing} variant="outline" onClick={() => handleAction('CEO Approved')} className="text-indigo-600 border-indigo-200">
                               Bypass to CEO Approve
                             </Button>
                          )}

                          {selectedItem.status === 'CEO Approved' && (
                            <Button disabled={processing} onClick={() => handleAction('Notice Active')} className="bg-orange-600 hover:bg-orange-700">
                              Start Notice Period
                            </Button>
                          )}
                          
                          {(selectedItem.status === 'Notice Active' || selectedItem.status === 'Clearance Pending') && (
                            <Button disabled={processing} onClick={handleFinalize} className="bg-emerald-600 hover:bg-emerald-700">
                              <ShieldCheck className="w-4 h-4 mr-2" /> Final Clearance & Relieve
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default AdminResignations;
