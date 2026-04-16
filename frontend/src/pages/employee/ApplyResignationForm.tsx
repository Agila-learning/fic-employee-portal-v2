import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { resignationService } from '@/api/resignationService';
import { Resignation } from '@/types';
import { Check, ChevronRight, ChevronLeft, Send, AlertTriangle } from 'lucide-react';

interface Props {
  onSuccess: (resignation: Resignation) => void;
  previousResignation: Resignation | null;
}

const ApplyResignationForm: React.FC<Props> = ({ onSuccess, previousResignation }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      appliedDate: new Date().toISOString().split('T')[0],
      proposedLastWorkingDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      reason: '',
      customReason: '',
      experience: '',
      whatLiked: '',
      challenges: '',
      clearResponsibilities: '',
      properSupport: '',
      workCultureRate: '',
      growthRate: '',
      managementRate: '',
      salaryRate: '',
      recommend: '',
      improveCulture: '',
      improveManagement: '',
      improveHR: '',
      improveTraining: '',
      finalFeedback: '',
      biggestAchievement: '',
      keyProjects: '',
      bestContribution: '',
      awards: '',
      skillsDeveloped: '',
      startedKT: false,
      pendingTasks: '',
      ongoingAssignments: '',
      handoutPersonName: '',
      clientDependencies: '',
      transitionComments: '',
      declarationConfirm: false,
      declarationLeave: false,
      declarationAbsence: false,
      declarationAssets: false,
    }
  });

  const reasonValue = watch('reason');
  const dConfirm = watch('declarationConfirm');
  const dLeave = watch('declarationLeave');
  const dAbsence = watch('declarationAbsence');
  const dAssets = watch('declarationAssets');

  const declarationsChecked = dConfirm && dLeave && dAbsence && dAssets;

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const onSubmit = async (data: any) => {
    if (!declarationsChecked) {
      toast.error('Please check all declarations before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await resignationService.submitResignation(data);
      toast.success('Resignation submitted successfully.');
      onSuccess(response);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit resignation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepProgress = () => (
    <div className="mb-8 flex items-center justify-between relative">
      <div className="absolute left-0 top-1/2 -z-10 h-1 w-full -translate-y-1/2 bg-slate-100 rounded-full"></div>
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <div 
          key={s} 
          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold transition-all duration-300 ${
            step >= s 
              ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30' 
              : 'bg-white border-slate-200 text-slate-400'
          }`}
        >
          {step > s ? <Check size={18} /> : s}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Apply for Resignation</h1>
        <p className="text-sm text-slate-500 mt-2">Complete the multi-step form to initiate your exit process.</p>
        
        {previousResignation?.status === 'Rejected' && (
          <div className="mt-4 p-4 border border-red-200 bg-red-50 text-red-700 rounded-xl flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Your previous resignation was rejected.</p>
              <p className="text-sm">You can apply again by filling this form.</p>
            </div>
          </div>
        )}
      </div>

      <StepProgress />

      <Card className="rounded-2xl border-slate-200/60 shadow-lg shadow-slate-100/50 bg-white/60 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-100/50 pb-6 bg-gradient-to-r from-amber-50/50 to-transparent">
          <CardTitle className="text-xl text-slate-800">
            {step === 1 && 'Basic Details & Reason'}
            {step === 2 && 'Experience Survey'}
            {step === 3 && 'Feedback & Suggestions'}
            {step === 4 && 'Achievements'}
            {step === 5 && 'Handover & Transition'}
            {step === 6 && 'Declaration & Submission'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* STEP 1 */}
            <div className={step === 1 ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Applied Date</label>
                  <Input type="date" {...register('appliedDate')} readOnly className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Proposed Last Working Date</label>
                  <Input type="date" {...register('proposedLastWorkingDate')} required />
                  <p className="text-xs text-slate-500">Auto-calculated 30 days from today. You can adjust if discussed with HR.</p>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Reason for Resignation</label>
                  <Select onValueChange={(v) => setValue('reason', v)} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Better career opportunity">Better career opportunity</SelectItem>
                      <SelectItem value="Higher education">Higher education</SelectItem>
                      <SelectItem value="Personal reasons">Personal reasons</SelectItem>
                      <SelectItem value="Relocation">Relocation</SelectItem>
                      <SelectItem value="Salary issue">Salary issue</SelectItem>
                      <SelectItem value="Work environment">Work environment</SelectItem>
                      <SelectItem value="Health reasons">Health reasons</SelectItem>
                      <SelectItem value="Family reasons">Family reasons</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reasonValue === 'Other' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Please specify your reason</label>
                    <Textarea {...register('customReason')} required className="min-h-[100px]" />
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2 */}
            <div className={step === 2 ? 'block' : 'hidden'}>
               <div className="space-y-6">
                 {/* Rating fields */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700">How would you rate work culture?</label>
                      <Select onValueChange={(v) => setValue('workCultureRate', v)}>
                        <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
                        <SelectContent>
                          {['Excellent', 'Good', 'Average', 'Poor'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700">How would you rate growth opportunities?</label>
                      <Select onValueChange={(v) => setValue('growthRate', v)}>
                        <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
                        <SelectContent>
                          {['Excellent', 'Good', 'Average', 'Poor'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700">How would you rate management support?</label>
                      <Select onValueChange={(v) => setValue('managementRate', v)}>
                        <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
                        <SelectContent>
                          {['Excellent', 'Good', 'Average', 'Poor'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700">How would you rate salary and benefits?</label>
                      <Select onValueChange={(v) => setValue('salaryRate', v)}>
                        <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
                        <SelectContent>
                          {['Excellent', 'Good', 'Average', 'Poor'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700">Would you recommend FIC to others?</label>
                      <Select onValueChange={(v) => setValue('recommend', v)}>
                        <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
                        <SelectContent>
                          {['Yes', 'No', 'Maybe'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                   </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">How was your overall experience at Forge India Connect?</label>
                    <Textarea {...register('experience')} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">What challenges did you face during your employment?</label>
                    <Textarea {...register('challenges')} />
                 </div>
               </div>
            </div>

            {/* STEP 3 - Feedback */}
            <div className={step === 3 ? 'block space-y-6' : 'hidden'}>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Suggestions to improve company culture</label>
                    <Textarea {...register('improveCulture')} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Suggestions to improve HR process / Training</label>
                    <Textarea {...register('improveHR')} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Any final feedback for management</label>
                    <Textarea {...register('finalFeedback')} />
                 </div>
            </div>

            {/* STEP 4 - Achievements */}
            <div className={step === 4 ? 'block space-y-6' : 'hidden'}>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Biggest achievement in FIC</label>
                    <Textarea {...register('biggestAchievement')} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Key projects handled / Best contribution</label>
                    <Textarea {...register('keyProjects')} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Skills developed during employment</label>
                    <Textarea {...register('skillsDeveloped')} />
                 </div>
            </div>

            {/* STEP 5 - Handover */}
            <div className={step === 5 ? 'block space-y-6' : 'hidden'}>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Have you started knowledge transfer?</label>
                     <Select onValueChange={(v) => setValue('startedKT', v === 'yes')}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Name of person to whom work is being handed over</label>
                    <Input {...register('handoutPersonName')} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Pending tasks / Ongoing assignments to handover</label>
                    <Textarea {...register('pendingTasks')} />
                 </div>
            </div>

            {/* STEP 6 - Declaration & Submit */}
            <div className={step === 6 ? 'block space-y-6' : 'hidden'}>
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <h3 className="font-bold text-slate-800 text-lg mb-4">Final Declaration</h3>
                  
                  <label className="flex items-start gap-4 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300" {...register('declarationConfirm')} />
                    <span className="text-sm text-slate-700 font-medium">I confirm that the information provided is true and accurate.</span>
                  </label>
                  
                  <label className="flex items-start gap-4 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300" {...register('declarationLeave')} />
                    <span className="text-sm text-slate-700 font-medium">I understand that leave is not permitted during the notice period.</span>
                  </label>
                  
                  <label className="flex items-start gap-4 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300" {...register('declarationAbsence')} />
                    <span className="text-sm text-slate-700 font-medium">I understand absences during the notice period may extend my last working date.</span>
                  </label>
                  
                  <label className="flex items-start gap-4 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300" {...register('declarationAssets')} />
                    <span className="text-sm text-slate-700 font-medium">I agree to return all company assets before final clearance.</span>
                  </label>
                </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between pt-6 border-t border-slate-100 mt-8">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePrev} 
                disabled={step === 1}
                className="rounded-xl px-6 gap-2"
              >
                <ChevronLeft size={16} /> Back
              </Button>
              
              {step < 6 ? (
                <Button 
                  type="button" 
                  onClick={handleNext}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-6 gap-2 shadow-lg shadow-amber-500/30"
                >
                  Save & Next <ChevronRight size={16} />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !declarationsChecked}
                  className={isSubmitting || !declarationsChecked ? "rounded-xl px-6" : "rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 shadow-lg shadow-emerald-500/30 gap-2"}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Resignation Request'}
                  {!isSubmitting && <Send size={16} />}
                </Button>
              )}
            </div>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplyResignationForm;
