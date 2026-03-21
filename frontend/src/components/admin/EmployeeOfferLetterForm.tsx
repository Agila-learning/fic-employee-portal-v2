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
    employmentType: 'Full-time',
    workMode: 'Onsite',
    location: '',
    officeAddress: '',
    roles: '1. Lead generation and market analysis\n2. Partnership development and client acquisition\n3. Ensuring sustainable business growth through target-driven execution',
    joiningDate: '',
    offerValidity: '7',
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
    const inHand = monthlyCTC - pfEmployer - esiEmployer - totalDeductions;

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
      netTakeHome: inHand
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
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="employmentType">Employment Type</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.employmentType}
                  onChange={(e) => setFormData({...formData, employmentType: e.target.value})}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Probationary">Probationary</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workMode">Work Mode</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.workMode}
                  onChange={(e) => setFormData({...formData, workMode: e.target.value})}
                >
                  <option value="Onsite">Onsite</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roles">Roles & Responsibilities</Label>
              <Textarea 
                id="roles" 
                rows={3} 
                value={formData.roles}
                onChange={(e) => setFormData({...formData, roles: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  value={formData.shiftTimings}
                  onChange={(e) => setFormData({...formData, shiftTimings: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportingManager">Reporting Manager</Label>
                <Input 
                  id="reportingManager" 
                  value={formData.reportingManager}
                  onChange={(e) => setFormData({...formData, reportingManager: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offerValidity">Offer Validity (Days)</Label>
                <Input 
                  id="offerValidity" 
                  type="number"
                  value={formData.offerValidity}
                  onChange={(e) => setFormData({...formData, offerValidity: e.target.value})}
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
          <div className="bg-white text-black p-0 shadow-2xl rounded-sm offer-letter-container flex flex-col font-serif">
            {/* Page 1: Introduction & Basic Terms */}
            <div className="p-12 min-h-[1100px] flex flex-col relative border-[12px] border-double border-slate-900 mb-8 page-break">
              {/* Side Border Stripes */}
              <div className="absolute left-1 top-0 bottom-0 w-1 bg-amber-500 opacity-20 print:hidden"></div>
              <div className="absolute right-1 top-0 bottom-0 w-1 bg-amber-500 opacity-20 print:hidden"></div>

              {/* 1. Header & Company Branding */}
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-8">
                <div className="flex items-center gap-5">
                  <img src={ficLogo} alt="Logo" className="h-24 w-24 object-contain" />
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tighter">FORGE INDIA CONNECT</h1>
                    <p className="text-[12px] font-bold tracking-[0.4em] text-amber-600 mt-1 uppercase">Connecting Talent with Opportunity</p>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Private Limited | CIN: [Optional CIN]</p>
                  </div>
                </div>
                <div className="text-right text-[10px] leading-relaxed text-slate-700 max-w-[200px]">
                  <p className="font-bold text-slate-900 uppercase mb-1 underline">Registered Headquarters:</p>
                  <p className="font-medium italic">{formData.officeAddress || 'Tamil Nadu, India'}</p>
                  <div className="mt-2 border-t border-slate-200 pt-1">
                    <p><span className="font-bold text-slate-900">GSTIN:</span> 33AAGCF4763Q1Z3</p>
                    <p><span className="font-bold text-slate-900">MOB:</span> +91 85085...[Your Mobile]</p>
                  </div>
                </div>
              </div>

              {/* Subject Line */}
              <div className="text-center mb-8">
                <h2 className="inline-block border-y-2 border-slate-900 py-1.5 px-12 text-xl font-black tracking-[0.2em] uppercase bg-slate-50">Letter of Appointment</h2>
                <p className="text-[10px] mt-2 text-slate-500 font-bold uppercase italic">Strictly Confidential & Personal</p>
              </div>

              {/* 2. Candidate & Offer Reference */}
              <div className="grid grid-cols-2 gap-0 mb-10 pb-6 border-b border-slate-100">
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-400 uppercase text-[9px] tracking-widest">Issued to Candidate:</p>
                  <p className="font-black text-lg text-slate-900 leading-none">{formData.candidateName || '[Selected Name]'}</p>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed max-w-[300px]">{formData.candidateAddress || '[Candidate Full Communication Address]'}</p>
                </div>
                <div className="text-right space-y-1.5 text-[11px] font-medium text-slate-700">
                  <p className="font-bold text-slate-400 uppercase text-[9px] tracking-widest">Offer Reference:</p>
                  <p><span className="font-bold text-slate-900">Issue Date:</span> {format(new Date(), 'dd MMMM yyyy')}</p>
                  <p><span className="font-bold text-slate-900">Offer Ref No:</span> FIC/HR/OL/{new Date().getFullYear()}/{Math.floor(1000 + Math.random() * 9000)}</p>
                  <p><span className="font-bold text-red-600 italic">Offer Validity: {formData.offerValidity} Working Days</span></p>
                </div>
              </div>

              {/* Content Body */}
              <div className="space-y-6 text-[12px] leading-relaxed text-slate-800 text-justify">
                <p>Dear <span className="font-black text-slate-900">{formData.candidateName.split(' ')[0]}</span>,</p>
                
                <p>
                  Following your recent interaction with our talent acquisition team and your successful technical evaluation, we are pleased to offer you the position of <span className="font-black border-b border-slate-900 uppercase">{formData.designation || '[TBD]'}</span> in the <span className="font-bold italic">{formData.department}</span> department at <span className="font-black text-slate-900">Forge India Connect Private Limited</span>.
                </p>

                {/* 1 & 2. Employment Terms */}
                <div>
                  <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 mb-3 tracking-widest text-[11px]">1. Final Offer & Position Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-slate-200">
                    <div className="space-y-2">
                      <p><span className="text-slate-500 font-bold uppercase text-[9px]">Designation:</span> <br/><span className="font-black text-slate-900">{formData.designation}</span></p>
                      <p><span className="text-slate-500 font-bold uppercase text-[9px]">Employment Type:</span> <br/><span className="font-black text-slate-900">{formData.employmentType}</span></p>
                      <p><span className="text-slate-500 font-bold uppercase text-[9px]">Reporting To:</span> <br/><span className="font-black text-slate-900">{formData.reportingManager}</span></p>
                    </div>
                    <div className="space-y-2">
                      <p><span className="text-slate-500 font-bold uppercase text-[9px]">Effective Joining Date:</span> <br/><span className="font-black text-slate-900 underline decoration-amber-500">{formData.joiningDate ? format(new Date(formData.joiningDate), 'eeee, dd MMMM yyyy') : '[Date Pending]'}</span></p>
                      <p><span className="text-slate-500 font-bold uppercase text-[9px]">Work Mode/Location:</span> <br/><span className="font-black text-slate-900">{formData.location} ({formData.workMode})</span></p>
                      <p><span className="text-slate-500 font-bold uppercase text-[9px]">Operating Hours:</span> <br/><span className="font-black text-slate-900">{formData.shiftTimings}</span></p>
                    </div>
                  </div>
                </div>

                {/* 3. Compensation Overview */}
                <div className="space-y-3">
                  <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 mb-1 tracking-widest text-[11px]">2. Remuneration & Benefits Structure</h3>
                  <p className="text-[11px]">Your total Fixed Cost to Company (CTC) shall be <span className="font-black text-slate-900">INR {(parseFloat(formData.ctc)).toLocaleString()} per annum</span>. The comprehensive monthly remuneration breakdown is as follows:</p>
                  
                  <table className="w-full border-collapse border border-slate-400">
                    <thead className="bg-slate-900 text-white text-[10px] uppercase font-black">
                      <tr>
                        <th className="border border-slate-400 p-2 text-left w-1/2">Component (Statutory & Fixed)</th>
                        <th className="border border-slate-400 p-2 text-right">Monthly (INR)</th>
                        <th className="border border-slate-400 p-2 text-right">Annual (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] font-medium">
                      <tr>
                        <td className="border border-slate-300 p-2">A. Basic Salary (50% of CTC)</td>
                        <td className="border border-slate-300 p-2 text-right">{calculations.basic.toLocaleString()}</td>
                        <td className="border border-slate-300 p-2 text-right">{(calculations.basic * 12).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2">House Rent Allowance (HRA)</td>
                        <td className="border border-slate-300 p-2 text-right">{calculations.hra.toLocaleString()}</td>
                        <td className="border border-slate-300 p-2 text-right">{(calculations.hra * 12).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 text-slate-500">Fixed Statutory Allowances (Medical/Conv)</td>
                        <td className="border border-slate-300 p-2 text-right text-slate-500">{(calculations.medical + calculations.conveyance).toLocaleString()}</td>
                        <td className="border border-slate-300 p-2 text-right text-slate-500">{((calculations.medical + calculations.conveyance) * 12).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="border border-slate-300 p-2 italic">Employer Contributions (Statutory PF/ESI)</td>
                        <td className="border border-slate-300 p-2 text-right italic">{(calculations.pfEmployer + calculations.esiEmployer).toLocaleString()}</td>
                        <td className="border border-slate-300 p-2 text-right italic">{((calculations.pfEmployer + calculations.esiEmployer) * 12).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2">Balanced Special Allowance</td>
                        <td className="border border-slate-300 p-2 text-right">{calculations.specialAllowance.toLocaleString()}</td>
                        <td className="border border-slate-300 p-2 text-right">{(calculations.specialAllowance * 12).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-900">
                        <td className="border border-slate-400 p-2 uppercase">Total Annual Fixed CTC</td>
                        <td className="border border-slate-400 p-2 text-right">INR {calculations.monthlyCTC.toLocaleString()}</td>
                        <td className="border border-slate-400 p-2 text-right">INR {(parseFloat(formData.ctc)).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="bg-amber-100 p-3 rounded-sm border-2 border-amber-600 text-center font-black text-slate-900">
                    Estimated Net In-Hand Salary: <span className="text-lg">INR {calculations.netTakeHome.toLocaleString()}</span> / month
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1 italic">(Subject to Standard TDS and Statutory Deductions)</p>
                  </div>
                </div>
              </div>

              {/* Page Footer */}
              <div className="mt-auto pt-8 flex justify-between items-end border-t border-slate-200">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Appointment Letter | Page [01/03]</p>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-900 uppercase">Forge India Connect Pvt Ltd</p>
                  <p className="text-[9px] text-amber-600 font-bold italic">"Excellence In Every Connection"</p>
                </div>
              </div>
            </div>

            {/* Page 2: Roles, Probation, Clauses */}
            <div className="p-12 min-h-[1100px] flex flex-col relative border-[12px] border-double border-slate-900 mb-8 page-break">
              
              {/* 6. Roles & Responsibilities */}
              <div className="space-y-6 text-[12px] leading-relaxed text-slate-800">
                <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 mb-1 tracking-widest text-[11px]">3. Key Roles, Responsibilities & Expectations</h3>
                <div className="bg-slate-50 p-6 rounded border border-slate-200 text-justify">
                  <p className="mb-4 font-bold italic underline">As a {formData.designation}, you shall be primarily responsible for the following:</p>
                  <ul className="space-y-2 list-none pl-2">
                    {formData.roles.split('\n').map((line, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-amber-600 font-black">▶</span>
                        <span className="font-medium text-slate-700">{line}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-[11px] font-bold text-slate-500 italic opacity-80">
                    Note: Your roles and responsibilities may evolve as per the organizational requirements and business objectives determined by the management from time to time.
                  </p>
                </div>

                {/* 4 & 5. Probation & Leave */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <h3 className="font-black text-slate-900 uppercase text-[10px] underline tracking-widest">4. Probation & Confirmation</h3>
                    <p className="text-[11px] text-justify font-medium">
                      You will be on a <span className="font-black text-slate-900">Probation Period of three (03) calendar months</span> from your actual date of joining. Management reserves the right to extend the probation based on periodic performance evaluations. Upon successful completion of probation and receipt of a formal confirmation letter, your employment status will transition to 'Permanent'.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-black text-slate-900 uppercase text-[10px] underline tracking-widest">5. Leave & Absence Policy</h3>
                    <p className="text-[11px] text-justify font-medium">
                      <span className="font-black text-slate-900">Entitlement:</span> You are entitled to 01 Casual/Sick leave per month (Total 12 annually). Leaves must be applied for at least 48 hours in advance via the company portal.
                      <br/><br/>
                      <span className="font-black text-slate-900 font-black">LOP/Absconding:</span> Unauthorized absence for more than 3 consecutive days will be considered 'Loss of Pay' (LOP) and may lead to disciplinary action including termination on grounds of absconding.
                    </p>
                  </div>
                </div>

                {/* 6. Legal & Security Compliance */}
                <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 mb-1 mt-6 tracking-widest text-[11px]">6. Confidentiality & Intellectual Property</h3>
                <div className="space-y-3 text-[11px] text-justify bg-slate-100 p-5 rounded border-l-4 border-slate-900">
                  <p>
                    <span className="font-black underline uppercase">Non-Disclosure:</span> During your tenure and after cessation of employment, you shall maintain absolute confidentiality regarding all Proprietary Information, Client Data, Trade Secrets, and Strategic Intellectual Property of <span className="font-bold">Forge India Connect Pvt Ltd</span>. Any breach of this clause will lead to immediate summary dismissal and legal action.
                  </p>
                  <p>
                    <span className="font-black underline uppercase">Ownership of Work:</span> Any work products, software code, research, or creative material produced by you during your employment shall be the exclusive property of the company.
                  </p>
                </div>

                {/* 7. Termination & Notice Period */}
                <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 mb-1 mt-6 tracking-widest text-[11px]">7. Notice Period & Termination of Services</h3>
                <div className="space-y-3 text-[11px] text-justify font-medium">
                  <p>
                    Either party may terminate this employment agreement by providing a <span className="font-black underline text-slate-900">Notice Period of 30 Calendar Days</span> or payment of Gross Monthly Salary in lieu of notice.
                  </p>
                  <p className="bg-red-50 p-2 text-red-800 border-l-2 border-red-800 italic">
                    Management reserves the right to terminate your services without notice or compensation on grounds of gross misconduct, fraud, persistent performance failure, or breach of company code of conduct.
                  </p>
                </div>

              </div>

              {/* Page Footer */}
              <div className="mt-auto pt-8 flex justify-between items-end border-t border-slate-200">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Appointment Letter | Page [02/03]</p>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-900 uppercase">Forge India Connect Pvt Ltd</p>
                  <p className="text-[9px] text-amber-600 font-bold italic">"Excellence In Every Connection"</p>
                </div>
              </div>
            </div>

            {/* Page 3: IT Policy, BGV & Acceptance */}
            <div className="p-12 min-h-[1100px] flex flex-col relative border-[12px] border-double border-slate-900 mb-0">
              
              <div className="space-y-6 text-[12px] leading-relaxed text-slate-800">
                
                {/* 8. IT & Data Policy */}
                <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 mb-1 tracking-widest text-[11px]">8. Information Technology & Resource Usage Policy</h3>
                <div className="space-y-2 text-[11px] text-justify font-medium">
                  <p>
                    Candidates are required to strictly adhere to the company's IT Policy. Systems provided are for business purposes only. Multi-factor authentication (MFA) and Access Control protocols must be followed. Unauthorized downloading of external software or sharing of organizational data via personal email is strictly prohibited and monitored.
                  </p>
                </div>

                {/* 9. Background Verification */}
                <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 mb-1 tracking-widest text-[11px]">9. Background & Reference Verification</h3>
                <div className="space-y-2 text-[11px] text-justify font-medium">
                  <p>
                    This offer is contingent upon clear reports from our internal Background Verification (BGV) process. Any falsification of details regarding education, previous experience, or salary history will result in immediate withdrawal of the offer or termination of employment if joined.
                  </p>
                </div>

                {/* 10. Non-Compete & Non-Solicitation */}
                <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 mb-1 tracking-widest text-[11px]">10. Non-Compete & Non-Solicitation Agreement</h3>
                <div className="space-y-2 text-[11px] text-justify font-medium bg-slate-50 p-4 border rounded">
                  <p>
                    You agree that for a period of 12 months post-cessation of employment, you shall not directly or indirectly:
                    <br/>
                    a. Join any direct competitor of <span className="font-bold">Forge India Connect Pvt Ltd</span>.
                    <br/>
                    b. Solicit or attempt to recruit any employee or client of the company.
                  </p>
                </div>

                <p className="mt-8 font-black text-center text-[13px] uppercase tracking-[0.2em] border-y-2 border-slate-900 py-2">Declaration & Final Acceptance</p>

                {/* 11 & 12. Execution & Signatures */}
                <div className="space-y-8 pt-6">
                  <p className="font-medium text-[11.5px] text-justify italic">
                    "I, <span className="font-black underline">{formData.candidateName || '[Selected Name]'}</span>, have read, understood, and hereby accept the terms and conditions set forth in this Appointment Letter. I confirm that I will join the organization on the mentioned date and shall adhere to all organizational policies and standards of conduct."
                  </p>

                  <div className="grid grid-cols-2 gap-16 px-4 pt-10">
                    {/* Management Signature */}
                    <div className="space-y-16">
                      <div className="border-t-2 border-slate-900 pt-3 relative">
                        <p className="font-black text-slate-900 text-[12px] uppercase">Mr. SANDEEP</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Chief Executive Officer (CEO)</p>
                        <div className="mt-6 flex flex-col gap-1 items-start">
                          <p className="text-[10px] font-bold text-slate-400">Verified by:</p>
                          <p className="font-black text-slate-900 text-[11px] uppercase">Mr. KARTHIK (MD)</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Managing Director</p>
                        </div>
                        {/* Company Stamp Placeholder */}
                        <div className="absolute -top-16 left-0 opacity-10 font-black text-slate-900 text-3xl border-4 border-slate-900 p-2 rounded transform -rotate-12 select-none pointer-events-none">
                          OFFER APPROVED
                        </div>
                      </div>
                    </div>

                    {/* Candidate Acceptance */}
                    <div className="space-y-16">
                      <div className="border-t-2 border-slate-900 pt-3 text-right">
                        <p className="font-black text-slate-900 text-[12px] uppercase leading-none">{formData.candidateName || '[Selected Name]'}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Candidate Signature</p>
                        <div className="mt-8 space-y-2 text-[10px] text-slate-400 font-bold">
                          <p>Acceptance Date: _____________________</p>
                          <p>Place: _____________________________</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Digital Acceptance Option */}
                <div className="mt-8 border-2 border-dashed border-amber-300 p-4 rounded text-center bg-amber-50/30">
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest underline decoration-amber-500 underline-offset-4 mb-1">Electronic Acceptance Signature Block</p>
                  <p className="text-[9px] text-slate-500 italic">This document is electronically verifiable. By signing above, you agree to the binding nature of the digital contract under the Information Technology Act, 2000.</p>
                </div>

              </div>

              {/* Page Footer */}
              <div className="mt-auto pt-8 flex justify-between items-end border-t border-slate-200">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Appointment Letter | Page [03/03]</p>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-900 uppercase">Forge India Connect Pvt Ltd</p>
                  <p className="text-[9px] text-amber-600 font-bold italic italic">"Connecting Talent with Opportunity"</p>
                </div>
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
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            display: block !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
            border: none !important;
            margin-bottom: 0 !important;
            padding: 30px !important;
            min-height: 297mm !important; /* A4 height approx */
          }
          .offer-letter-container {
            border: none !important;
          }
          .bg-slate-900 {
            -webkit-print-color-adjust: exact;
            background-color: #0f172a !important;
            color: white !important;
          }
          .bg-amber-100 {
            -webkit-print-color-adjust: exact;
            background-color: #fef3c7 !important;
          }
           .bg-slate-50 {
            -webkit-print-color-adjust: exact;
            background-color: #f8fafc !important;
          }
        }
        .font-black {
          font-weight: 900;
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
