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
    candidateAddress: '',
    designation: '',
    department: 'Sales & Operations',
    workMode: 'Onsite',
    location: '',
    officeAddress: '',
    roles: '1. Lead generation and market analysis\n2. Partnership development and client acquisition\n3. Ensuring sustainable business growth through target-driven execution',
    joiningDate: '',
    shiftTimings: '9:30 AM - 6:30 PM',
    reportingManager: '',
    ctc: '',
  });

  const locations = ['Bangalore', 'Krishnagiri', 'Thirupattur', 'Chennai'];

  const handleLocationChange = (val: string) => {
    let addr = '';
    if (val === 'Krishnagiri') {
      addr = 'RK Towers, Rayakottai road, Opposite to HP Petrol Bunk, Wahab Nager, Krishnagiri-635002';
    }
    setFormData({ ...formData, location: val, officeAddress: addr });
  };

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
    const hra = Math.round(basic * 0.50); // 50% of basic
    const medical = 1250;
    const conveyance = 1600;
    
    // PF Calculation (Employee - 12%)
    const pfEmployee = Math.round(Math.min(basic, 15000) * 0.12);
    
    // ESI Calculation (Employee - 0.75% if monthly gross <= 21000)
    const esiEmployee = monthlyCTC <= 21000 ? Math.ceil(monthlyCTC * 0.0075) : 0;
    
    // Employer Contributions
    const pfEmployer = Math.round(Math.min(basic, 15000) * 0.13); // 12% PF + 1% admin
    const esiEmployer = monthlyCTC <= 21000 ? Math.ceil(monthlyCTC * 0.0325) : 0;
    
    // Special Allowance acts as a balancing figure to reach CTC
    const currentTotal = basic + hra + medical + conveyance + pfEmployer + esiEmployer;
    const specialAllowance = Math.max(0, monthlyCTC - currentTotal);

    const totalDeductions = pfEmployee + esiEmployee;

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
                <Label htmlFor="candidateAddress">Candidate Residence Address</Label>
                <Input 
                  id="candidateAddress" 
                  placeholder="Address for communication" 
                  value={formData.candidateAddress}
                  onChange={(e) => setFormData({...formData, candidateAddress: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input 
                  id="designation" 
                  placeholder="e.g. Business Development Executive" 
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input 
                  id="department" 
                  placeholder="e.g. Digital Marketing" 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Work Location (Base City)</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                >
                  <option value="">Select Location</option>
                  {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workMode">Employment Type / Mode</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.workMode}
                  onChange={(e) => setFormData({...formData, workMode: e.target.value})}
                >
                  <option value="Onsite">Full-time Onsite</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roles">Roles & Responsibilities</Label>
              <Textarea 
                id="roles" 
                rows={3} 
                placeholder="Enter roles line by line..." 
                value={formData.roles}
                onChange={(e) => setFormData({...formData, roles: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="shiftTimings">Shift Timings</Label>
                <Input 
                  id="shiftTimings" 
                  placeholder="e.g. 9:30 AM - 6:30 PM" 
                  value={formData.shiftTimings}
                  onChange={(e) => setFormData({...formData, shiftTimings: e.target.value})}
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
          <div className="bg-white text-black p-0 shadow-2xl rounded-sm min-h-[1400px] border-[12px] border-double border-slate-900 offer-letter-container overflow-hidden flex flex-col">
            {/* Side Border Stripes */}
            <div className="absolute left-1 top-0 bottom-0 w-1 bg-amber-500 opacity-30"></div>
            <div className="absolute right-1 top-0 bottom-0 w-1 bg-amber-500 opacity-30"></div>

            <div className="p-8 flex-1 flex flex-col">
              {/* 1. Header & Company Details */}
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex items-center gap-4">
                  <img src={ficLogo} alt="Logo" className="h-20 w-20 object-contain" />
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 leading-none tracking-tighter">FORGE INDIA CONNECT</h1>
                    <p className="text-[11px] font-bold tracking-[0.3em] text-amber-600 mt-1 uppercase">Connecting Talent with Opportunity</p>
                    <p className="text-[10px] text-slate-500 font-bold">PRIVATE LIMITED</p>
                  </div>
                </div>
                <div className="text-right text-[10px] leading-tight text-slate-700">
                  <p className="font-bold text-slate-900 uppercase mb-1">Corporate Headquarters:</p>
                  <p>{formData.officeAddress || 'Tamil Nadu, India'}</p>
                  <p className="mt-2"><span className="font-bold text-slate-900">GSTIN:</span> 33AAGCF4763Q1Z3</p>
                  <p><span className="font-bold text-slate-900">MOB:</span> +91 85085...[Your Mobile]</p>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center mb-6">
                <h2 className="inline-block border-y-2 border-slate-900 py-1 px-8 text-lg font-black tracking-widest uppercase">Letter of Appointment</h2>
              </div>

              <div className="grid grid-cols-2 gap-0 mb-6 border-b border-slate-200 pb-4">
                {/* 2. Candidate Details */}
                <div className="space-y-1 text-[11px]">
                  <p className="font-bold text-slate-500 uppercase text-[9px]">Issued to:</p>
                  <p className="font-black text-sm text-slate-900">{formData.candidateName || '[Candidate Name]'}</p>
                  <p className="text-slate-600 max-w-[250px]">{formData.candidateAddress || '[Candidate Address]'}</p>
                </div>
                <div className="text-right space-y-1 text-[11px]">
                  <p className="font-bold text-slate-500 uppercase text-[9px]">Reference Details:</p>
                  <p><span className="font-bold text-slate-900">Date:</span> {format(new Date(), 'dd MMMM yyyy')}</p>
                  <p><span className="font-bold text-slate-900">ID:</span> FIC/OL/{new Date().getFullYear()}/{Math.floor(1000 + Math.random() * 9000)}</p>
                </div>
              </div>

              {/* Main Content Sections */}
              <div className="space-y-5 text-[10.5px] leading-[1.3] text-slate-800">
                
                {/* 3 & 4. Job & Joining Details */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-3 rounded-md border border-slate-200">
                  <div>
                    <h3 className="font-bold text-slate-900 border-b border-slate-300 mb-2 pb-1 uppercase tracking-wider text-[9px]">3. Employment Details</h3>
                    <div className="space-y-1">
                      <p><span className="text-slate-500">Designation:</span> <span className="font-bold">{formData.designation || '[TBD]'}</span></p>
                      <p><span className="text-slate-500">Department:</span> <span className="font-bold">{formData.department}</span></p>
                      <p><span className="text-slate-500">Reporting To:</span> <span className="font-bold">{formData.reportingManager || '[TBD]'}</span></p>
                      <p><span className="text-slate-500">Location:</span> <span className="font-bold">{formData.location || '[TBD]'} ({formData.workMode})</span></p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 border-b border-slate-300 mb-2 pb-1 uppercase tracking-wider text-[9px]">4. Joining Logistics</h3>
                    <div className="space-y-1">
                      <p><span className="text-slate-500">Date of Joining:</span> <span className="font-bold">{formData.joiningDate ? format(new Date(formData.joiningDate), 'dd MMMM yyyy') : '[TBD]'}</span></p>
                      <p><span className="text-slate-500">Working Hours:</span> <span className="font-bold">{formData.shiftTimings}</span></p>
                      <p><span className="text-slate-500">Shift Type:</span> <span className="font-bold">Standard Day Shift</span></p>
                    </div>
                  </div>
                </div>

                {/* 5. Compensation */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <span className="bg-slate-900 text-white px-1 text-[10px]">5</span> Compensation Structure
                  </h3>
                  <table className="w-full border-collapse border border-slate-300">
                    <thead className="bg-slate-100 text-[9px] uppercase font-bold text-slate-700">
                      <tr>
                        <th className="border border-slate-300 p-1.5 text-left w-1/2">Components</th>
                        <th className="border border-slate-300 p-1.5 text-right w-1/4">Monthly (INR)</th>
                        <th className="border border-slate-300 p-1.5 text-right w-1/4">Annual (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px]">
                      <tr>
                        <td className="border border-slate-300 p-1.5">Basic Salary (50% of CTC)</td>
                        <td className="border border-slate-300 p-1.5 text-right">{calculations.basic.toLocaleString()}</td>
                        <td className="border border-slate-300 p-1.5 text-right">{(calculations.basic * 12).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5">House Rent Allowance (HRA)</td>
                        <td className="border border-slate-300 p-1.5 text-right">{calculations.hra.toLocaleString()}</td>
                        <td className="border border-slate-300 p-1.5 text-right">{(calculations.hra * 12).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5">Fixed Allowances (Medical & Conveyance)</td>
                        <td className="border border-slate-300 p-1.5 text-right">{(calculations.medical + calculations.conveyance).toLocaleString()}</td>
                        <td className="border border-slate-300 p-1.5 text-right">{((calculations.medical + calculations.conveyance) * 12).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5">Special Allowance</td>
                        <td className="border border-slate-300 p-1.5 text-right">{calculations.specialAllowance.toLocaleString()}</td>
                        <td className="border border-slate-300 p-1.5 text-right">{(calculations.specialAllowance * 12).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-900">
                        <td className="border border-slate-300 p-1.5">Gross Total Earnings (A)</td>
                        <td className="border border-slate-300 p-1.5 text-right">{(calculations.basic + calculations.hra + calculations.medical + calculations.conveyance + calculations.specialAllowance).toLocaleString()}</td>
                        <td className="border border-slate-300 p-1.5 text-right">{((calculations.basic + calculations.hra + calculations.medical + calculations.conveyance + calculations.specialAllowance) * 12).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 text-slate-500 italic">Employer Statutory Contributions (PF & ESI) (B)</td>
                        <td className="border border-slate-300 p-1.5 text-right text-slate-500">{(calculations.pfEmployer + calculations.esiEmployer).toLocaleString()}</td>
                        <td className="border border-slate-300 p-1.5 text-right text-slate-500">{((calculations.pfEmployer + calculations.esiEmployer) * 12).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-900 text-white font-black">
                        <td className="border border-slate-600 p-1.5 uppercase">Annual Total CTC (A + B)</td>
                        <td className="border border-slate-600 p-1.5 text-right">INR {calculations.monthlyCTC.toLocaleString()}</td>
                        <td className="border border-slate-600 p-1.5 text-right">INR {(parseFloat(formData.ctc)).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[9px] italic text-slate-500">* Payment Cycle: 1st of every month. Standard deductions (PF, ESI, Tax) applicable as per Govt norms.</p>
                </div>

                {/* 6. Roles & Responsibilities */}
                <div>
                  <h3 className="font-bold text-slate-900 uppercase underline decoration-amber-500 decoration-2 underline-offset-4 mb-2">6. Key Roles & Responsibilities</h3>
                  <div className="bg-amber-50/50 p-3 rounded border-r-4 border-amber-500">
                    <p className="text-[10px] text-slate-700 leading-relaxed font-medium">
                      {formData.roles.split('\n').map((line, i) => (
                        <span key={i} className="block mb-1">✓ {line}</span>
                      ))}
                    </p>
                  </div>
                </div>

                {/* 7 & 8. Terms, Probation & Leave */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-bold border-l-2 border-slate-900 pl-2 uppercase text-[9px]">7. Terms & Probation</h3>
                    <p className="text-[10px] text-slate-600">
                      There will be a <span className="font-bold">three (03) month probation period</span> from your DOJ. Confirmation will be based on performance review by Management.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold border-l-2 border-slate-900 pl-2 uppercase text-[9px]">8. Leave & Holiday Policy</h3>
                    <p className="text-[10px] text-slate-600">
                      Monthly 01 Casual/Sick leave (Total 12 annually) + Paid Public holidays as per company calendar.
                    </p>
                  </div>
                </div>

                {/* 9, 10, 11. Security, Termination & Conduct */}
                <div className="space-y-3 bg-slate-900 text-slate-300 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-[9px]">
                    <div>
                      <p className="font-bold text-white mb-1 uppercase tracking-tighter underline">9. Confidentiality</p>
                      <p className="opacity-80">Strict adherence to Data Protection and Non-Disclosure of client/company data is mandatory.</p>
                    </div>
                    <div>
                      <p className="font-bold text-white mb-1 uppercase tracking-tighter underline">10. Termination</p>
                      <p className="opacity-80">Requires 30 days notice or equivalent salary. Management reserves rights for instant dismissal on misconduct.</p>
                    </div>
                    <div>
                      <p className="font-bold text-white mb-1 uppercase tracking-tighter underline">11. Code of Conduct</p>
                      <p className="opacity-80">Professionalism and compliance with all HR rules as mentioned in company handbook is required.</p>
                    </div>
                  </div>
                </div>

                {/* 12. Acceptance */}
                <div className="pt-4 mt-auto">
                  <p className="font-bold text-center mb-6 uppercase text-[10px] tracking-widest text-slate-500">12. Execution & Acceptance</p>
                  <div className="grid grid-cols-2 gap-12 mt-4 px-4">
                    <div className="space-y-12">
                      <div className="border-t border-slate-900 pt-2 flex flex-col gap-1 items-start">
                        <p className="font-black text-slate-900 text-[11px] uppercase">Mr. Sandeep</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-none">Chief Executive Officer (CEO)</p>
                        <p className="text-[10px] mt-4">Verified by: <span className="font-bold">Mr. Karthik (MD)</span></p>
                      </div>
                    </div>
                    <div className="space-y-12">
                      <div className="border-t border-slate-900 pt-2 text-right">
                        <p className="font-black text-slate-900 text-[11px] uppercase leading-none">{formData.candidateName || '[Selected Name]'}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Candidate Signature</p>
                        <p className="text-[9px] mt-4 italic text-slate-400">Accepted on: _____________________</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Stamp */}
              <div className="mt-8 border-t border-slate-100 py-2 text-center">
                <p className="text-[9px] font-black text-slate-900 tracking-[0.4em] uppercase">Forge India Connect Private Limited</p>
                <p className="text-[8px] text-amber-600 font-bold italic">"Excellence In Every Connection"</p>
              </div>
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
            height: auto !important;
            min-height: 0 !important;
          }
          .print:hidden {
            display: none !important;
          }
        }
        .offer-letter-container {
          background-image: radial-gradient(#cbd5e1 0.5px, transparent 0.5px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};

export default EmployeeOfferLetterForm;
