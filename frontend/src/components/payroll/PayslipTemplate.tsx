import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface PayslipProps {
  payslip: any;
}

const PayslipTemplate = ({ payslip }: PayslipProps) => {
  const slipRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!slipRef.current) return;
    try {
      const canvas = await html2canvas(slipRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${payslip.employee_name}_${MONTHS[payslip.month - 1]}_${payslip.year}.pdf`);
    } catch {
      alert('Failed to download payslip');
    }
  };

  const earnings = [
    { label: 'Basic Salary', value: payslip.basic_salary },
    { label: 'HRA', value: payslip.hra },
    { label: 'Conveyance Allowance', value: payslip.conveyance_allowance },
    { label: 'Medical Allowance', value: payslip.medical_allowance },
    { label: 'Special Allowance', value: payslip.special_allowance },
    { label: 'Other Earnings', value: payslip.other_earnings },
  ].filter(e => Number(e.value) > 0);

  const deductions = [
    { label: 'PF (Employee)', value: payslip.pf_employee },
    { label: 'PF (Employer)', value: payslip.pf_employer },
    { label: 'ESI (Employee)', value: payslip.esi_employee },
    { label: 'ESI (Employer)', value: payslip.esi_employer },
    { label: 'Professional Tax', value: payslip.professional_tax },
    { label: 'TDS', value: payslip.tds },
    { label: 'Other Deductions', value: payslip.other_deductions },
  ].filter(d => Number(d.value) > 0);

  const fmt = (v: any) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const maxRows = Math.max(earnings.length, deductions.length);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" /> Download PDF
        </Button>
      </div>

      <div ref={slipRef} style={{ background: '#fff', color: '#000', padding: '32px', fontFamily: 'Arial, sans-serif', fontSize: '13px', lineHeight: '1.5' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '3px solid #1e3a5f', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '8px' }}>
            <img src="/images/company-logo-payslip.jpeg" alt="Logo" style={{ height: '60px', width: 'auto' }} crossOrigin="anonymous" />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a5f', margin: 0 }}>FORGE INDIA CONNECT PVT. LTD</h1>
          <p style={{ fontSize: '11px', color: '#555', margin: '4px 0' }}>RK Towers, Rayakottai Road, Opposite to HP Petrol Bunk, Wahab Nagar, Krishnagiri - 635002</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a5f', marginTop: '8px', textDecoration: 'underline' }}>
            PAYSLIP FOR THE MONTH OF {MONTHS[payslip.month - 1].toUpperCase()} {payslip.year}
          </p>
        </div>

        {/* Employee Details */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 8px', fontWeight: 'bold', width: '25%' }}>Employee Name</td>
              <td style={{ padding: '4px 8px', width: '25%' }}>{payslip.employee_name}</td>
              <td style={{ padding: '4px 8px', fontWeight: 'bold', width: '25%' }}>Employee ID</td>
              <td style={{ padding: '4px 8px', width: '25%' }}>{payslip.employee_id || '-'}</td>
            </tr>
            <tr style={{ background: '#f8f9fa' }}>
              <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>Department</td>
              <td style={{ padding: '4px 8px' }}>{payslip.department || '-'}</td>
              <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>Designation</td>
              <td style={{ padding: '4px 8px' }}>{payslip.designation || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>PAN Number</td>
              <td style={{ padding: '4px 8px' }}>{payslip.pan_number || '-'}</td>
              <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>UAN Number</td>
              <td style={{ padding: '4px 8px' }}>{payslip.uan_number || '-'}</td>
            </tr>
            <tr style={{ background: '#f8f9fa' }}>
              <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>Bank Name</td>
              <td style={{ padding: '4px 8px' }}>{payslip.bank_name || '-'}</td>
              <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>Bank A/C No.</td>
              <td style={{ padding: '4px 8px' }}>{payslip.bank_account_number || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>Working Days</td>
              <td style={{ padding: '4px 8px' }}>{payslip.total_working_days}</td>
              <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>Days Worked</td>
              <td style={{ padding: '4px 8px' }}>{payslip.days_worked}</td>
            </tr>
          </tbody>
        </table>

        {/* Salary Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333' }}>
          <thead>
            <tr style={{ background: '#1e3a5f', color: '#fff' }}>
              <th style={{ padding: '8px', border: '1px solid #333', width: '25%', textAlign: 'left' }}>Earnings</th>
              <th style={{ padding: '8px', border: '1px solid #333', width: '25%', textAlign: 'right' }}>Amount (₹)</th>
              <th style={{ padding: '8px', border: '1px solid #333', width: '25%', textAlign: 'left' }}>Deductions</th>
              <th style={{ padding: '8px', border: '1px solid #333', width: '25%', textAlign: 'right' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxRows }).map((_, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                <td style={{ padding: '6px 8px', border: '1px solid #ccc' }}>{earnings[i]?.label || ''}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #ccc', textAlign: 'right' }}>{earnings[i] ? fmt(earnings[i].value) : ''}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #ccc' }}>{deductions[i]?.label || ''}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #ccc', textAlign: 'right' }}>{deductions[i] ? fmt(deductions[i].value) : ''}</td>
              </tr>
            ))}
            {/* Totals */}
            <tr style={{ background: '#e8f0fe', fontWeight: 'bold' }}>
              <td style={{ padding: '8px', border: '1px solid #333' }}>Gross Salary</td>
              <td style={{ padding: '8px', border: '1px solid #333', textAlign: 'right' }}>{fmt(payslip.gross_salary)}</td>
              <td style={{ padding: '8px', border: '1px solid #333' }}>Total Deductions</td>
              <td style={{ padding: '8px', border: '1px solid #333', textAlign: 'right' }}>{fmt(payslip.total_deductions)}</td>
            </tr>
          </tbody>
        </table>

        {/* Net Pay */}
        <div style={{ marginTop: '16px', padding: '12px', background: '#1e3a5f', color: '#fff', textAlign: 'center', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
            NET PAY: {fmt(payslip.net_salary)}
          </p>
          {Number(payslip.ctc) > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.8 }}>CTC (Annual): {fmt(payslip.ctc)}</p>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '24px', fontSize: '10px', color: '#888', textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: '12px' }}>
          <p style={{ margin: 0 }}>This is a system-generated payslip and does not require a signature.</p>
          <p style={{ margin: '4px 0 0' }}>Forge India Connect Pvt. Ltd | RK Towers, Rayakottai Road, Krishnagiri - 635002</p>
        </div>
      </div>
    </div>
  );
};

export default PayslipTemplate;
