import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Printer, Download, Calculator, FileText, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ficLogo from '@/assets/fic-logo.jpeg';
import { format } from 'date-fns';

const EmployeeOfferLetterForm = () => {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    candidateName: '',
    designation: '',
    roles: '1. Lead generation and market analysis\n2. Partnership development and client acquisition\n3. Ensuring sustainable business growth through target-driven execution',
    joiningDate: '',
    reportingManager: '',
    ctc: '',
  });

  const [calculations, setCalculations] = useState<any>(null);

  const calculateSalary = () => {
    const annualCTC = parseFloat(formData.ctc);
    if (isNaN(annualCTC) || annualCTC <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid CTC', variant: 'destructive' });
      return;
    }

    const monthlyCTC = Math.round(annualCTC / 12);
    
    // Calculate components (Simplified Indian Standard)
    const basic = Math.round(monthlyCTC * 0.50); // 50% of monthly CTC
    const hra = Math.round(basic * 0.40); // 40% of basic
    const medical = 1250;
    const conveyance = 1600;
    
    // PF Calculation (Employee - 12%)
    const pfEmployee = Math.round(Math.min(basic, 15000) * 0.12);
    
    // ESI Calculation (Employee - 0.75% if monthly gross <= 21000)
    const esiEmployee = monthlyCTC <= 21000 ? Math.ceil(monthlyCTC * 0.0075) : 0;
    
    // Employer Contributions
    const pfEmployer = Math.round(Math.min(basic, 15000) * 0.13); // 12% PF + 1% admin
    const esiEmployer = monthlyCTC <= 21000 ? Math.ceil(monthlyCTC * 0.0325) : 0;
    
    const totalDeductions = pfEmployee + esiEmployee;
    const netTakeHome = monthlyCTC - (pfEmployer + esiEmployer + totalDeductions); // Very simplified
    
    // Special Allowance acts as a balancing figure to reach CTC
    const currentTotal = basic + hra + medical + conveyance + pfEmployer + esiEmployer;
    const specialAllowance = Math.max(0, monthlyCTC - currentTotal);

    setCalculations({
      monthlyCTC,
      basic,
      hra,
      medical,
      conveyance,
      specialAllowance,
      pfEmployee,
      esiEmployee,
      pfEmployer,
      esiEmployer,
      netTakeHome: monthlyCTC - pfEmployer - esiEmployer - totalDeductions
    });
    
    toast({ title: 'Success', description: 'Salary components calculated' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Section */}
      <div className="space-y-6 print:hidden">
        <Card className="border-none shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calculator className="h-5 w-5 text-primary" />
              Employee Details & CTC
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="candidateName">Candidate Full Name</Label>
                <Input 
                  id="candidateName" 
                  placeholder="e.g. John Doe" 
                  value={formData.candidateName}
                  onChange={(e) => setFormData({...formData, candidateName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input 
                  id="designation" 
                  placeholder="e.g. Business Development Executive" 
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roles">Roles & Responsibilities</Label>
              <Textarea 
                id="roles" 
                rows={4} 
                placeholder="Enter roles line by line..." 
                value={formData.roles}
                onChange={(e) => setFormData({...formData, roles: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input 
                  id="joiningDate" 
                  type="date" 
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportingManager">Reporting Manager</Label>
                <Input 
                  id="reportingManager" 
                  placeholder="Name of manager" 
                  value={formData.reportingManager}
                  onChange={(e) => setFormData({...formData, reportingManager: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label htmlFor="ctc" className="text-lg font-bold">Annual CTC (INR)</Label>
              <div className="flex gap-2 mt-2">
                <Input 
                  id="ctc" 
                  type="number" 
                  placeholder="e.g. 500000" 
                  className="text-lg font-bold"
                  value={formData.ctc}
                  onChange={(e) => setFormData({...formData, ctc: e.target.value})}
                />
                <Button onClick={calculateSalary} className="gap-2 shrink-0 h-12">
                  <Calculator className="h-4 w-4" />
                  Calculate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">
                * PF computed at 12% of basic. ESI included if CTC &lt;= 21,000/month.
              </p>
            </div>
          </CardContent>
        </Card>

        {calculations && (
          <div className="flex gap-4">
            <Button onClick={handlePrint} className="flex-1 gap-2 h-12 bg-amber-600 hover:bg-amber-700">
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </Button>
          </div>
        )}
      </div>

      {/* Preview Section */}
      <div className="relative">
        {!calculations ? (
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-12 text-center text-muted-foreground bg-muted/10 opacity-60">
            <FileText className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold">Offer Letter Preview</h3>
            <p className="max-w-xs mt-2">Fill the form and calculate salary to see the professional offer letter template.</p>
          </div>
        ) : (
          <div className="bg-white text-black p-8 shadow-2xl rounded-sm min-h-[1000px] border border-slate-200 offer-letter-container overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
              <div className="flex items-center gap-4">
                <img src={ficLogo} alt="Logo" className="h-16 w-16 object-contain border p-1" />
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-none">FORGE INDIA CONNECT</h2>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-amber-600 mt-1 uppercase">Building Future</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">PRIVATE LIMITED</p>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-600">
                <p className="font-bold text-slate-900 border-b border-slate-200 mb-1 pb-1">Corporate Headquarters:</p>
                <p>Forge India Connect Pvt Ltd</p>
                <p>Tamil Nadu, India</p>
                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-0.5">
                  <p><span className="font-bold text-slate-900">GSTIN:</span> 33AABC...[Your GST No]</p>
                  <p><span className="font-bold text-slate-900">MOB:</span> +91 85085...[Your Mobile]</p>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="space-y-6 text-xs text-slate-800 leading-relaxed">
              <p className="font-bold">Date: {format(new Date(), 'dd MMMM yyyy')}</p>
              
              <div className="space-y-1">
                <p className="font-bold uppercase tracking-wide">CONFIDENTIAL OFFER OF EMPLOYMENT</p>
                <p>To,</p>
                <p className="font-bold text-sm">{formData.candidateName}</p>
              </div>

              <p>Dear <span className="font-bold">{formData.candidateName.split(' ')[0]}</span>,</p>
              
              <p>
                Following our recent discussions, we are pleased to offer you the position of <span className="font-bold">{formData.designation}</span> at <span className="font-bold text-slate-900">Forge India Connect Private Limited</span>. Your joining date is confirmed as <span className="font-bold underline">{formData.joiningDate ? format(new Date(formData.joiningDate), 'dd MMMM yyyy') : '[Select Date]'}</span>.
              </p>

              <div>
                <p className="font-bold mb-2 underline decoration-amber-500/30 decoration-2 underline-offset-4">1. COMPANY OVERVIEW</p>
                <p className="text-slate-600 text-[10px] text-justify">
                  Forge India Connect Private Limited is a professionally driven and rapidly growing organization established with a clear vision of connecting talent with opportunity and supporting businesses with reliable and result-oriented solutions. Over the past five years, the company has steadily built its presence across multiple domains including Business Development, Staffing & Payroll Services, Job Consultation, Insurance Services, Digital Marketing, and Application & Website Development.
                </p>
              </div>

              <div>
                <p className="font-bold mb-2 underline decoration-amber-500/30 decoration-2 underline-offset-4">2. LEADERSHIP & ACHIEVEMENT</p>
                <p className="text-slate-600 text-[10px] text-justify">
                  Forge India Connect Private Limited is led by its Director, Mr. Sandeep, whose vision and leadership have played a key role in the company’s success. His dedication towards empowering individuals and supporting organizations has resulted in a remarkable achievement of over 1500 successful job placements across multiple sectors in the last five years. These sectors include Banking, IT, Non-IT, BPO, and Manufacturing industries.
                </p>
                <p className="italic text-amber-600 font-bold text-[10px] mt-2 border-l-2 border-amber-500 pl-3">
                  “Success is not just about growth—it is about creating impact in people’s lives.”
                </p>
              </div>

              <div>
                <p className="font-bold mb-2 underline decoration-amber-500/30 decoration-2 underline-offset-4">3. REMUNERATION AND BENEFITS</p>
                <p className="mb-3">Your Annual Total Cost to Company (CTC) will be <span className="font-bold whitespace-nowrap">INR {parseFloat(formData.ctc).toLocaleString()}</span>. The monthly salary breakup is provided below:</p>
                
                <table className="w-full border-collapse border border-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2 text-left">Salary Components</th>
                      <th className="border border-slate-300 p-2 text-right">Monthly (INR)</th>
                      <th className="border border-slate-300 p-2 text-right">Annual (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2">Basic Salary</td>
                      <td className="border border-slate-300 p-2 text-right font-medium">{calculations.basic.toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-right font-medium">{(calculations.basic * 12).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2">House Rent Allowance (HRA)</td>
                      <td className="border border-slate-300 p-2 text-right">{calculations.hra.toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-right">{(calculations.hra * 12).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2">Conveyance Allowance</td>
                      <td className="border border-slate-300 p-2 text-right">{calculations.conveyance.toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-right">{(calculations.conveyance * 12).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2">Medical Allowance</td>
                      <td className="border border-slate-300 p-2 text-right">{calculations.medical.toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-right">{(calculations.medical * 12).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2">Special Allowance</td>
                      <td className="border border-slate-300 p-2 text-right">{calculations.specialAllowance.toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-right">{(calculations.specialAllowance * 12).toLocaleString()}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="border border-slate-300 p-2">Gross Earnings (A)</td>
                      <td className="border border-slate-300 p-2 text-right">{(calculations.basic + calculations.hra + calculations.conveyance + calculations.medical + calculations.specialAllowance).toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-right">{( (calculations.basic + calculations.hra + calculations.conveyance + calculations.medical + calculations.specialAllowance) * 12).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 text-slate-500 italic">Employer PF Contribution (B)</td>
                      <td className="border border-slate-300 p-2 text-right text-slate-500">{calculations.pfEmployer.toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-right text-slate-500">{(calculations.pfEmployer * 12).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 text-slate-500 italic">Employer ESI Contribution (C)</td>
                      <td className="border border-slate-300 p-2 text-right text-slate-500">{calculations.esiEmployer.toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-right text-slate-500">{(calculations.esiEmployer * 12).toLocaleString()}</td>
                    </tr>
                    <tr className="bg-slate-900 text-white font-bold">
                      <td className="border border-slate-600 p-2">Total CTC (A+B+C)</td>
                      <td className="border border-slate-600 p-2 text-right">{calculations.monthlyCTC.toLocaleString()}</td>
                      <td className="border border-slate-600 p-2 text-right">{parseFloat(formData.ctc).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <p className="font-bold mb-2 underline decoration-amber-500/30 decoration-2 underline-offset-4 uppercase">4. ROLES AND RESPONSIBILITIES</p>
                <div className="space-y-1 text-slate-700 ml-4">
                  {formData.roles.split('\n').map((role, i) => (
                    <p key={i}>• {role}</p>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="space-y-12">
                  <p>For <span className="font-bold">Forge India Connect Pvt Ltd</span></p>
                  <p className="font-bold">Authorised Signatory</p>
                </div>
                <div className="space-y-12 text-right">
                  <p>Accepted by</p>
                  <p className="font-bold">{formData.candidateName}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-4 border-t border-slate-200 text-center space-y-1">
              <p className="text-[10px] font-black text-slate-900 tracking-widest uppercase">Forge India Connect Private Limited</p>
              <p className="text-[9px] text-amber-600 font-bold italic italic">"Connecting Talent with Opportunity"</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .offer-letter-container, .offer-letter-container * {
            visibility: visible;
          }
          .offer-letter-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          .print:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeOfferLetterForm;
