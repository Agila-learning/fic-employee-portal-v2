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

const COMPANIES = {
  'Forge India Connect': {
    name: 'FORGE INDIA CONNECT PVT LTD',
    shortName: 'Forge India Connect',
    logo: ficLogo,
    tagline: 'Connecting Talent with Opportunity',
    cin: 'U47912TZ2025PTC035121',
    gst: '33AAGCF4763Q1Z3',
    mobile: '+91 6369506416',
    email: 'info@forgeindiaconnect.com',
    website: 'www.forgeindiaconnect.com',
    address: 'RK Towers, Rayakottai road, Opposite to HP Petrol Bunk, Wahab Nager, Krishnagiri-635002',
    profile: 'is a professionally driven and rapidly growing organization established with a clear vision of connecting talent with opportunity and supporting businesses with reliable and result-oriented solutions. Over the past five years, the company has steadily built its presence across multiple domains including Business Development, Staffing & Payroll Management. Our mission is to bridge the gap between human potential and industry requirements through innovation, ethics, and excellence.',
    services: [], // Added for type consistency
    ceo: 'Mr. SANDEEP',
    md: 'Mr. KARTHIK (MD)',
    footerText: 'Official HQ: Krishnagiri, Tamil Nadu'
  },
  'Antigraviity': {
    name: 'Antigraviity technologies Pvt. Ltd',
    shortName: 'Antigraviity',
    logo: null, // User can upload
    tagline: 'Delivering Modern Digital Solutions',
    cin: 'U62011TN2026PTC188212',
    gst: '29ABCDE1234F1Z5', // Placeholder
    mobile: '+91 9876543210', // Placeholder
    email: 'info@antigraviity.com',
    website: 'www.antigraviity.com',
    address: 'Excel coworking, 2nd floor, Nagarbhavi, Papareddypalya, Bangalore',
    profile: 'is an IT services startup based in Bangalore and Chennai, founded by Mr. Sandeep. The company specializes in delivering modern digital solutions to businesses.',
    services: [
      'Web Development: Designing and developing modern, responsive, and scalable websites.',
      'App Development: Building user-friendly mobile applications for Android and iOS platforms.',
      'Digital Marketing: Providing SEO, social media marketing, and online branding solutions.',
      'UI/UX Design: Creating intuitive and visually appealing user interfaces and experiences.',
      'Custom IT Solutions: Tailored software solutions based on business needs.'
    ],
    ceo: 'Mr. SANDEEP',
    md: null,
    footerText: 'HQ: Bangalore | Chennai'
  }
};

const EmployeeOfferLetterForm = () => {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const downloadAsWord = () => {
    if (!printRef.current) return;
    
    // Improved styles for Word conversion
    const styles = `
      <style>
        body { font-family: 'Times New Roman', Times, serif; }
        .page-break { 
          page-break-after: always; 
          margin-bottom: 20pt; 
          border-bottom: 1px solid #eee;
          padding: 20pt;
        }
        h1 { font-size: 24pt; color: #1e293b; font-weight: bold; text-align: center; }
        h2 { font-size: 18pt; color: #1e293b; font-weight: bold; text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 5pt; }
        h3 { font-size: 11pt; color: #0f172a; font-weight: bold; border-left: 4px solid #f59e0b; padding-left: 8pt; margin-top: 15pt; text-transform: uppercase; }
        p { font-size: 10.5pt; line-height: 1.5; text-align: justify; }
        .text-amber-600 { color: #d97706; }
        .text-blue-600 { color: #2563eb; }
        .font-black { font-weight: 900; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .italic { font-style: italic; }
        .underline { text-decoration: underline; }
        table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
        th, td { border: 1px solid #e2e8f0; padding: 6pt; text-align: left; }
        th { background-color: #f8fafc; font-weight: bold; }
        .bg-slate-50 { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10pt; border-radius: 4pt; margin: 10pt 0; }
        .flex-col-center { text-align: center; }
      </style>
    `;

    const content = printRef.current.innerHTML;
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Offer Letter - ${formData.candidateName}</title>
        ${styles}
      </head>
      <body>
    `;
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Offer_Letter_${formData.candidateName.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Success', description: 'Offer Letter downloaded as Word' });
  };
  
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
    selectedCompany: 'Forge India Connect',
    customLogo: '',
    tagline: '',
    additionalPoints: '',
  });

  const selectedCompany = formData.selectedCompany as keyof typeof COMPANIES;
  const companyData = COMPANIES[selectedCompany];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, customLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

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
              Offer Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selectedCompany">Select Company</Label>
                <select 
                  id="selectedCompany"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.selectedCompany}
                  onChange={(e) => setFormData({...formData, selectedCompany: e.target.value})}
                >
                  <option value="Forge India Connect">Forge India Connect Pvt Ltd</option>
                  <option value="Antigraviity">Antigraviity (IT Services Startup)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUpload">Logo (Optional Upload)</Label>
                <Input 
                  id="logoUpload" 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="candidateName">Employee Full Name</Label>
                <Input 
                  id="candidateName" 
                  placeholder="e.g. John Doe" 
                  value={formData.candidateName}
                  onChange={(e) => setFormData({...formData, candidateName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidateAddress">Employee Residence Address</Label>
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

            <div className="space-y-2">
              <Label htmlFor="additionalPoints">Additional Points / Terms (Optional)</Label>
              <Textarea 
                id="additionalPoints" 
                rows={3} 
                placeholder="Add any extra terms or points to appear at the end"
                value={formData.additionalPoints}
                onChange={(e) => setFormData({...formData, additionalPoints: e.target.value})}
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
            <Button onClick={downloadAsWord} variant="outline" className="flex-1 gap-2 h-12 border-amber-600 text-amber-600 hover:bg-amber-50">
              <Download className="h-4 w-4" />
              Download as Word
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
          <div className="bg-white text-black p-0 shadow-2xl rounded-sm offer-letter-container flex flex-col font-serif relative overflow-hidden">
            {/* Page 1: Introduction & Company Profile */}
            <div className="p-12 min-h-[1050px] flex flex-col relative border-[12px] border-double border-slate-900 mb-8 page-break">
              {/* Page Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                <img src={formData.customLogo || companyData.logo || ficLogo} alt="Watermark" className="w-[500px] h-[500px] object-contain grayscale" />
              </div>

              {selectedCompany === 'Antigraviity' ? (
                <div className="flex flex-col items-center mb-8">
                  <img src={formData.customLogo || companyData.logo || ficLogo} alt="Logo" className="h-[90px] w-auto object-contain mb-4" />
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">{companyData.name}</h1>
                  <p className="text-[10px] font-bold text-amber-600 mt-2 uppercase tracking-widest">CIN : {companyData.cin}</p>
                  <div className="w-full border-b-2 border-blue-400/30 mt-4 mb-6"></div>
                  
                  <p className="text-xl font-serif italic text-amber-600 font-bold mb-6">"{formData.tagline || companyData.tagline}"</p>
                  
                  <div className="text-center w-full max-w-[600px] border-y-2 border-slate-900 py-2.5 mb-1 bg-white">
                    <h2 className="text-2xl font-black tracking-[0.3em] uppercase text-slate-900">Letter of Appointment</h2>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase italic tracking-widest mb-6">Confidential Employment Document</p>
                </div>
              ) : (
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                  <div className="flex items-center gap-4">
                    <img src={formData.customLogo || companyData.logo || ficLogo} alt="Logo" className="h-[70px] w-[70px] object-contain" />
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 leading-none tracking-tighter uppercase">{companyData.name}</h1>
                      <p className="text-[10px] font-bold tracking-[0.3em] text-amber-600 mt-1 uppercase">{formData.tagline || companyData.tagline}</p>
                      <div className="mt-2 text-[8px] font-bold text-slate-500 flex gap-4 uppercase tracking-tighter">
                        <span>CIN: {companyData.cin}</span>
                        <span>GST: {companyData.gst}</span>
                        <span>MOB: {companyData.mobile}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[9px] leading-relaxed text-slate-700 max-w-[220px]">
                    <p className="font-bold text-slate-900 uppercase underline">Corporate Headquarters:</p>
                    <p className="font-medium">{formData.officeAddress || companyData.address}</p>
                  </div>
                </div>
              )}

              {selectedCompany !== 'Antigraviity' && (
                <div className="text-center mb-6">
                  <h2 className="inline-block border-y-2 border-slate-900 py-1.5 px-12 text-xl font-black tracking-[0.2em] uppercase bg-slate-50">Letter of Appointment</h2>
                  <p className="text-[9px] mt-1 text-slate-400 font-bold uppercase italic tracking-widest">Confidential Employment Document</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-0 mb-8 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <p className="font-bold text-slate-400 uppercase text-[8px] tracking-widest">Employee Information:</p>
                  <p className="font-black text-base text-slate-900 leading-none">{formData.candidateName || '[Name Needed]'}</p>
                  <p className="text-[10.5px] text-slate-600 font-medium leading-tight max-w-[280px]">{formData.candidateAddress || '[Full Address]'}</p>
                </div>
                <div className="text-right space-y-1 text-[10px] font-medium text-slate-700">
                  <p className="font-bold text-slate-400 uppercase text-[8px] tracking-widest">Reference Details:</p>
                  <p><span className="font-bold text-slate-900 uppercase">Date of Issue:</span> {format(new Date(), 'dd MMMM yyyy')}</p>
                  <p><span className="font-bold text-slate-900 uppercase">Offer ID:</span> {selectedCompany === 'Antigraviity' ? 'ANT' : 'FIC'}/HR/AP/{new Date().getFullYear()}/{Math.floor(1000 + Math.random() * 9000)}</p>
                  <p><span className="font-bold text-amber-600 italic">Validity: {formData.offerValidity} Days</span></p>
                </div>
              </div>

              {/* Content Body */}
              <div className="space-y-6 text-[11.5px] leading-snug text-slate-800 text-justify">
                <p>Dear <span className="font-black text-slate-900 uppercase tracking-tighter">{formData.candidateName.split(' ')[0]}</span>,</p>
                
                <p>
                  We are pleased to offer you the formal appointment for the position of <span className="font-black border-b border-slate-900 uppercase text-slate-900">{formData.designation || '[TBD]'}</span> in the <span className="font-bold italic">{formData.department}</span> division at <span className="font-black text-slate-900">{companyData.name}</span>.
                </p>

                {/* 1. Company Profile */}
                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 tracking-widest text-[10px]">1. Company Overview & Vision</h3>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 text-[10.5px] text-justify leading-relaxed">
                    <p>
                      <span className="font-bold">{companyData.name}</span> {companyData.profile}
                    </p>
                    {selectedCompany === 'Antigraviity' && companyData.services && (
                      <div className="mt-2 space-y-1">
                        <p className="font-bold text-[9px] uppercase tracking-tighter text-slate-500">Key Services:</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {companyData.services.map((service, idx) => (
                            <li key={idx} className="text-[9.5px]">{service}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Position & Logistics */}
                <div>
                  <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 mb-2 tracking-widest text-[10px]">2. Terms of Engagement</h3>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-slate-200">
                    <div className="space-y-2">
                      <p><span className="text-slate-500 font-bold uppercase text-[8px]">Job Title:</span> <br/><span className="font-black text-slate-900">{formData.designation}</span></p>
                      <p><span className="text-slate-500 font-bold uppercase text-[8px]">Type:</span> <br/><span className="font-black text-slate-900">{formData.employmentType}</span></p>
                      <p><span className="text-slate-500 font-bold uppercase text-[8px]">Reports To:</span> <br/><span className="font-black text-slate-900">{formData.reportingManager}</span></p>
                    </div>
                    <div className="space-y-2">
                      <p><span className="text-slate-500 font-bold uppercase text-[8px]">Joining Date:</span> <br/><span className="font-black text-slate-900 underline decoration-amber-500">{formData.joiningDate ? format(new Date(formData.joiningDate), 'dd MMMM yyyy') : '[TBD]'}</span></p>
                      <p><span className="text-slate-500 font-bold uppercase text-[8px]">Location (Mode):</span> <br/><span className="font-black text-slate-900">{formData.location} ({formData.workMode})</span></p>
                      <p><span className="text-slate-500 font-bold uppercase text-[8px]">Shift Window:</span> <br/><span className="font-black text-slate-900">{formData.shiftTimings}</span></p>
                    </div>
                  </div>
                </div>

                {/* 3. Compensation Summary */}
                <div className="space-y-3">
                  <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 mb-1 tracking-widest text-[10px]">3. Compensation & Structure</h3>
                  <table className="w-full border-collapse border border-slate-400">
                    <thead className="bg-slate-900 text-white text-[9px] uppercase font-black">
                      <tr>
                        <th className="border border-slate-400 p-2 text-left w-1/2">Remuneration Component</th>
                        <th className="border border-slate-400 p-2 text-right">Monthly (INR)</th>
                        <th className="border border-slate-400 p-2 text-right">Annual (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-medium">
                      <tr>
                        <td className="border border-slate-300 p-1.5 px-3">Primary Basic Salary</td>
                        <td className="border border-slate-300 p-1.5 text-right">{calculations.basic.toLocaleString()}</td>
                        <td className="border border-slate-300 p-1.5 text-right">{(calculations.basic * 12).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 px-3">House Rent Allowance (HRA)</td>
                        <td className="border border-slate-300 p-1.5 text-right">{calculations.hra.toLocaleString()}</td>
                        <td className="border border-slate-300 p-1.5 text-right">{(calculations.hra * 12).toLocaleString()}</td>
                      </tr>
                      <tr className="text-slate-500">
                        <td className="border border-slate-300 p-1.5 px-3 italic">Statutory Allowances (Med/Conv)</td>
                        <td className="border border-slate-300 p-1.5 text-right italic">{(calculations.medical + calculations.conveyance).toLocaleString()}</td>
                        <td className="border border-slate-300 p-1.5 text-right italic">{((calculations.medical + calculations.conveyance) * 12).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 px-3">Company Special Allowance</td>
                        <td className="border border-slate-300 p-1.5 text-right">{calculations.specialAllowance.toLocaleString()}</td>
                        <td className="border border-slate-300 p-1.5 text-right">{(calculations.specialAllowance * 12).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-50 italic">
                        <td className="border border-slate-300 p-1.5 px-3">Employer Contributions (PF/ESI)</td>
                        <td className="border border-slate-300 p-1.5 text-right">{(calculations.pfEmployer + calculations.esiEmployer).toLocaleString()}</td>
                        <td className="border border-slate-300 p-1.5 text-right">{((calculations.pfEmployer + calculations.esiEmployer) * 12).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-900 text-[11px]">
                        <td className="border border-slate-400 p-2 uppercase">Gross Cost To Company (CTC)</td>
                        <td className="border border-slate-400 p-2 text-right">INR {calculations.monthlyCTC.toLocaleString()}</td>
                        <td className="border border-slate-400 p-2 text-right">INR {(parseFloat(formData.ctc)).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="bg-amber-100 p-3 rounded-sm border-2 border-amber-600 text-center font-black text-slate-900 text-[12px]">
                    Monthly Net Take-Home Salary: <span className="text-lg">INR {calculations.netTakeHome.toLocaleString()}</span>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-1 italic text-center">(Approximate after standard TDS and Statutory deductions)</p>
                  </div>
                </div>
              </div>

              {/* Professional Footer (Overhauled) */}
              {selectedCompany === 'Antigraviity' ? (
                <div className="mt-auto pt-4 flex flex-col items-center">
                  <div className="w-full border-t border-blue-400/50 mb-3"></div>
                  <div className="flex justify-center gap-12 text-[10px] text-blue-600 font-medium w-full px-6">
                    <p>Website: <span className="underline decoration-blue-200">{companyData.website}</span></p>
                    <p>Address: <span className="underline decoration-blue-200">{companyData.address}</span></p>
                  </div>
                </div>
              ) : (
                <div className="mt-auto pt-4 flex justify-between items-end border-t border-slate-200">
                  <div className="text-[8px] text-slate-400 font-bold uppercase space-y-0.5">
                    <p>Page 1 of 3 | {formData.candidateName || 'Employee Copy'}</p>
                    <p>Email: {companyData.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-900 uppercase">{companyData.name}</p>
                    <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest italic">{companyData.website}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Page 2: Responsibilities, Legal & Compliance */}
            <div className="p-12 min-h-[1050px] flex flex-col relative border-[12px] border-double border-slate-900 mb-8 page-break">
              {/* Page Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                <img src={formData.customLogo || companyData.logo || ficLogo} alt="Watermark" className="w-[500px] h-[500px] object-contain grayscale" />
              </div>

              {/* 4. Roles & Responsibilities */}
              <div className="space-y-6 text-[11.5px] leading-snug text-slate-800">
                <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 tracking-widest text-[10px]">4. Job Description & Execution Objectives</h3>
                <div className="bg-slate-50 p-6 rounded border border-slate-200">
                  <p className="mb-4 font-bold text-slate-900 tracking-tight underline uppercase text-[10px]">Core Responsibilities Highlight:</p>
                  <ul className="space-y-2 list-none">
                    {formData.roles.split('\n').map((line, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-amber-500 font-black">✔</span>
                        <span className="font-medium text-slate-700 leading-tight">{line}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-[9.5px] font-bold text-slate-400 italic">
                    Management reserves the right to modify job duties and reporting hierarchy in alignment with evolving business requirements.
                  </p>
                </div>

                {/* 5 & 6. Probation & Leave (Tightened) */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h3 className="font-black text-slate-900 uppercase text-[9px] underline tracking-widest">5. Probationary Period</h3>
                    <p className="text-[10.5px] text-justify font-medium leading-relaxed">
                      You will undergo a <span className="font-black text-slate-900">Probation for three months</span>. Confirmation is performance-contingent. Management may extend probation if performance goals are not explicitly met.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-slate-900 uppercase text-[9px] underline tracking-widest">6. Leave & Holiday Entitlement</h3>
                    <p className="text-[10.5px] text-justify font-medium leading-relaxed">
                      You are entitled to 12 Sick/Casual leaves annually (01 per month). Public holidays apply as per the annual company schedule. Unauthorized absence for 3 days leads to LOP.
                    </p>
                  </div>
                </div>

                {/* 7. Legal Guardrails */}
                <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 mt-4 tracking-widest text-[10px]">7. Confidentiality & Intellectual Ownership</h3>
                <div className="space-y-3 text-[10.5px] text-justify bg-slate-100 p-5 rounded border-l-4 border-slate-900 leading-relaxed font-medium">
                  <p>
                    <span className="font-black underline uppercase">Non-Disclosure Agreement:</span> You shall maintain absolute secrecy of all organizational data, proprietary software, client lists, and strategic insights. Any breach will result in immediate termination and legal prosecution for damages.
                  </p>
                  <p>
                    <span className="font-black underline uppercase">Asset Protection:</span> All creative, technical, or strategic outputs produced by you remain the exclusive property of <span className="font-bold">{companyData.shortName}</span>.
                  </p>
                </div>

                {/* 8. Separation Policy */}
                <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 mt-4 tracking-widest text-[10px]">8. Resignation & Termination Policies</h3>
                <div className="space-y-2 text-[10.5px] text-justify leading-relaxed font-medium">
                  <p>
                    Separation requires a formal <span className="font-black text-slate-900">Notice Period of 30 Days</span> or salary in lieu. Immediate termination applies for gross misconduct, fraud, or code of conduct violations.
                  </p>
                  <p className="bg-red-50 p-3 text-red-900 border-l-2 border-red-700 italic opacity-85">
                    "Absconding from duty or consistent failure in meeting behavioral compliance will be grounds for summary dismissal without settlement."
                  </p>
                </div>

                {formData.additionalPoints && (
                  <div className="space-y-2">
                    <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 mt-4 tracking-widest text-[10px]">9. Additional Agreed Terms</h3>
                    <div className="bg-slate-50 p-4 border rounded text-[10.5px] font-medium leading-relaxed whitespace-pre-wrap">
                      {formData.additionalPoints}
                    </div>
                  </div>
                )}

              </div>

              {/* Professional Footer */}
              {selectedCompany === 'Antigraviity' ? (
                <div className="mt-auto pt-4 flex flex-col items-center">
                  <div className="w-full border-t border-blue-400/50 mb-3"></div>
                  <div className="flex justify-center gap-12 text-[10px] text-blue-600 font-medium w-full px-6">
                    <p>Website: <span className="underline decoration-blue-200">{companyData.website}</span></p>
                    <p>Address: <span className="underline decoration-blue-200">{companyData.address}</span></p>
                  </div>
                </div>
              ) : (
                <div className="mt-auto pt-4 flex justify-between items-end border-t border-slate-200">
                  <div className="text-[8px] text-slate-400 font-bold uppercase space-y-0.5">
                    <p>Page 2 of 3 | {companyData.website}</p>
                    <p>Contact: {companyData.mobile}</p>
                  </div>
                  <div className="text-right">
                    <p>{companyData.email}</p>
                    <p className="text-[9px] font-black text-slate-900 uppercase leading-none">{companyData.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Page 3: IT, BGV & Acceptance */}
            <div className="p-12 min-h-[1050px] flex flex-col relative border-[12px] border-double border-slate-900 mb-0">
              {/* Page Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                <img src={formData.customLogo || companyData.logo || ficLogo} alt="Watermark" className="w-[500px] h-[500px] object-contain grayscale" />
              </div>
              
              <div className="space-y-6 text-[11.5px] leading-snug text-slate-800">
                
                {/* 9. IT Usage */}
                <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 tracking-widest text-[10px]">9. IT & Cybersecurity Policy Compliance</h3>
                <div className="text-[10.5px] leading-relaxed font-medium">
                  <p>
                    All organizational hardware, emails, and data access points are strictly for business usage. Monitoring protocols are in place to prevent data leaks. Sharing of passwords or unauthorized system modifications is a punishable offense under Indian Cyber Laws.
                  </p>
                </div>

                {/* 10. Background Verification */}
                <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 tracking-widest text-[10px]">10. Selection Contingencies (BGV)</h3>
                <div className="text-[10.5px] leading-relaxed font-medium">
                  <p>
                    Engagement depends on clear Background Verification (BGV) reports. Any discrepancy in previous salary, experience, or academic credentials will result in instant offer withdrawal.
                  </p>
                </div>

                {/* 11. Non-Solicitation */}
                <h3 className="font-black text-slate-900 uppercase border-l-4 border-amber-500 pl-3 tracking-widest text-[10px]">11. Non-Solicitation & Ethical Conduct</h3>
                <div className="bg-slate-50 p-4 border rounded text-[10.5px] font-medium italic opacity-90 text-justify">
                  <p>
                    "Upon cessation of employment, you shall not solicit clients, vendors, or employees of {companyData.shortName} for a period of one (01) year. Ethical conduct and non-compromise on brand integrity is expected during and after your tenure."
                  </p>
                </div>

                <div className="text-center pt-4">
                  <p className="inline-block font-black text-[13px] uppercase tracking-[0.2em] border-y-2 border-slate-900 py-1.5 px-8">Final Declaration & Acceptance</p>
                </div>

                {/* 12. Signatures (Tightened) */}
                <div className="space-y-6 pt-4">
                  <p className="font-medium text-[11px] text-justify leading-relaxed">
                    "I, <span className="font-black underline uppercase">{formData.candidateName || '[Selected Name]'}</span>, acknowledge the receipt of this Appointment Letter and hereby accept all terms and conditions specified. I declare that I will report for duty at the stipulated time and maintain the highest level of professional decorum."
                  </p>

                  <div className="grid grid-cols-2 gap-16 pt-8 pb-4">
                    {/* Management */}
                    <div className="space-y-12">
                      <div className="pt-2 relative">
                        <p className="font-black text-slate-900 text-[11px] uppercase leading-none">{companyData.ceo}</p>
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest leading-none mt-1">Chief Executive Officer (CEO)</p>
                        {companyData.md && (
                          <div className="mt-4 flex flex-col gap-0.5 items-start bg-slate-50 p-2 rounded border border-dashed border-slate-200">
                            <p className="text-[8px] font-bold text-slate-400 italic">Auth Verification:</p>
                            <p className="font-black text-slate-900 text-[10px] uppercase">{companyData.md}</p>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Managing Director</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Employee */}
                    <div className="space-y-12">
                      <div className="border-t-2 border-slate-900 pt-2 text-right">
                        <p className="font-black text-slate-900 text-[11px] uppercase leading-none">{formData.candidateName || '[Selected Name]'}</p>
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1">Accepting Employee Signature</p>
                        <div className="mt-6 space-y-1 text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                          <p>Date: _____/_____/_________</p>
                          <p>Place: _____________________</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Digitally Signed Tag (Tightened) */}
                {selectedCompany !== 'Antigraviity' && (
                  <div className="mt-6 border-2 border-dashed border-amber-300 p-3 rounded text-center bg-amber-50/20">
                    <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-0.5">e-Verifiable Appointment Contract</p>
                    <p className="text-[8px] text-slate-400 font-bold leading-none italic uppercase">Valid for Payroll & HR Operations across all FIC Corporate Units</p>
                  </div>
                )}

              </div>

              {/* Final Page Footer */}
              {selectedCompany === 'Antigraviity' ? (
                <div className="mt-auto pt-4 flex flex-col items-center">
                  <div className="w-full border-t border-blue-400/50 mb-3"></div>
                  <div className="flex justify-center gap-12 text-[10px] text-blue-600 font-medium w-full px-6">
                    <p>Website: <span className="underline decoration-blue-200">{companyData.website}</span></p>
                    <p>Address: <span className="underline decoration-blue-200">{companyData.address}</span></p>
                  </div>
                </div>
              ) : (
                <div className="mt-auto pt-4 flex justify-between items-end border-t border-slate-200">
                  <div className="text-[8px] text-slate-400 font-bold uppercase space-y-0.5 text-left">
                    <p>{companyData.email} | {companyData.website} | Page 3 of 3</p>
                    <p>{companyData.footerText}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-900 uppercase leading-none">{companyData.name}</p>
                    <p className="text-[8px] text-amber-600 font-bold italic">"{formData.tagline || companyData.tagline}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @page {
          size: A4;
          margin: 0;
        }
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
            width: 210mm !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            display: block !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
            border: none !important;
            margin: 0 !important;
            padding: 15mm !important;
            height: 297mm !important;
            width: 210mm !important;
            box-sizing: border-box !important;
            position: relative !important;
            overflow: hidden !important;
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
        .page-break {
          background-image: radial-gradient(#cbd5e1 0.4px, transparent 0.4px);
          background-size: 15px 15px;
          height: 1050px;
          width: 794px; /* A4 width in pixels at 96dpi */
          margin: 0 auto 20px auto;
        }
      `}</style>
    </div>
  );
};

export default EmployeeOfferLetterForm;
