import React from 'react';
import { Resignation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileDown, CalendarDays, Clock, ShieldCheck, DoorOpen, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props {
  resignation: Resignation;
}

const ResignationStatusView: React.FC<Props> = ({ resignation }) => {
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

  const calculateNoticeProgress = () => {
    if (!resignation.noticePeriod || !resignation.noticePeriod.totalDays) return 0;
    const completed = resignation.noticePeriod.completedDays || 0;
    const total = resignation.noticePeriod.totalDays;
    return Math.min(100, Math.round((completed / total) * 100));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Resignation Status</h1>
          <p className="text-sm text-slate-500 mt-2">Track the progress of your exit process.</p>
        </div>
        <Badge className={`px-4 py-1.5 text-sm font-semibold rounded-full ${getStatusColor(resignation.status)}`}>
          {resignation.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Notice Period Widget */}
        <Card className="col-span-1 md:col-span-2 rounded-2xl shadow-lg shadow-slate-100/50 border-slate-200/60 bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Clock size={120} />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
              <CalendarDays className="text-amber-500" />
              Notice Period Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resignation.status === 'Submitted' || resignation.status === 'HR Approved' || resignation.status === 'CEO Approved' ? (
              <div className="py-8 text-center text-slate-500 font-medium">
                Notice period tracking starts after final approval.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-slate-500 font-medium mb-1">Days Completed</p>
                    <p className="text-3xl font-bold text-slate-800">
                      {resignation.noticePeriod?.completedDays || 0}
                      <span className="text-lg text-slate-400 font-normal"> / {resignation.noticePeriod?.totalDays || 30}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 font-medium mb-1">Remaining</p>
                    <p className="text-2xl font-bold text-amber-500">{resignation.noticePeriod?.remainingDays || 0} Days</p>
                  </div>
                </div>
                
                <Progress value={calculateNoticeProgress()} className="h-3 bg-slate-100 [&>div]:bg-amber-500 rounded-full" />
                
                <div className="bg-slate-100 rounded-xl p-4 flex justify-between items-center text-sm">
                  <div>
                    <p className="text-slate-500">Revised Last Working Date</p>
                    <p className="font-semibold text-slate-800">
                      {resignation.noticePeriod?.expectedLastWorkingDate 
                        ? new Date(resignation.noticePeriod.expectedLastWorkingDate).toLocaleDateString() 
                        : new Date(resignation.proposedLastWorkingDate).toLocaleDateString()}
                    </p>
                  </div>
                  {resignation.noticePeriod?.extraDaysAdded ? (
                    <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                      +{resignation.noticePeriod.extraDaysAdded} Days Added (Absences)
                    </Badge>
                  ) : null}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action / Relieving Letter Widget */}
        <Card className="rounded-2xl shadow-lg shadow-slate-100/50 border-slate-200/60 bg-gradient-to-br from-white to-slate-50">
           <CardHeader>
             <CardTitle className="text-xl">Actions</CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
             <div className="flex flex-col gap-4">
                <div className="p-4 border border-slate-100 bg-white rounded-xl flex items-start gap-3">
                   <ShieldCheck className="text-slate-400 mt-0.5" />
                   <div>
                     <p className="text-sm font-semibold text-slate-800">Asset Clearance</p>
                     <p className="text-xs text-slate-500 mt-1">
                       {resignation.status === 'Completed' ? 'All clear.' : 'Pending return of company assets.'}
                     </p>
                   </div>
                </div>
                
                {resignation.status === 'Completed' && resignation.relievingLetterUrl && (
                  <a 
                    href={`${import.meta.env.VITE_API_URL || '/api'}${resignation.relievingLetterUrl.replace('/uploads', '/uploads')}`}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="w-full"
                  >
                    <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300">
                      <FileDown size={18} />
                      Download Relieving Letter
                    </button>
                  </a>
                )}
             </div>
           </CardContent>
        </Card>

        {/* Timeline Widget */}
        <Card className="col-span-1 md:col-span-3 rounded-2xl shadow-lg shadow-slate-100/50 border-slate-200/60">
           <CardHeader>
             <CardTitle className="text-xl flex items-center gap-2">
               <DoorOpen className="text-amber-500" />
               Exit Timeline
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-8 pl-4 py-4 border-l-2 border-slate-100 ml-4">
               {resignation.timeline.map((event, index) => (
                 <div key={index} className="relative">
                   <div className="absolute -left-[25px] flex items-center justify-center w-6 h-6 bg-white border-2 border-amber-500 rounded-full text-amber-500">
                     <CheckCircle2 size={14} className="fill-amber-500 text-white" />
                   </div>
                   <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 ml-6 shadow-sm relative before:absolute before:border-8 before:border-transparent before:border-r-slate-100 before:-left-4 before:top-2">
                     <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-slate-800">{event.status}</h4>
                       <span className="text-xs text-slate-400">
                         {new Date(event.date || new Date()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                       </span>
                     </div>
                     <p className="text-sm text-slate-600">{event.remarks}</p>
                     {event.changedBy && typeof event.changedBy === 'object' && (
                       <p className="text-xs text-slate-400 mt-2">By: {event.changedBy.name}</p>
                     )}
                   </div>
                 </div>
               ))}
             </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResignationStatusView;
