const mongoose = require('mongoose');

const payslipSchema = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employee_name: { type: String },
    employee_id: { type: String },
    department: { type: String },
    designation: { type: String },
    month: { type: Number, required: true },
    year: { type: Number, required: true },

    // Earnings
    basic_salary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    conveyance_allowance: { type: Number, default: 0 },
    medical_allowance: { type: Number, default: 0 },
    special_allowance: { type: Number, default: 0 },
    other_earnings: { type: Number, default: 0 },
    gross_salary: { type: Number, default: 0 },

    // Deductions
    pf_employee: { type: Number, default: 0 },
    pf_employer: { type: Number, default: 0 },
    esi_employee: { type: Number, default: 0 },
    esi_employer: { type: Number, default: 0 },
    professional_tax: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    other_deductions: { type: Number, default: 0 },
    total_deductions: { type: Number, default: 0 },

    net_salary: { type: Number, required: true },
    ctc: { type: Number, default: 0 },

    // Statutory/Bank info
    bank_name: { type: String },
    bank_account_number: { type: String },
    pan_number: { type: String },
    uan_number: { type: String },

    // Attendance info
    total_working_days: { type: Number, default: 30 },
    days_worked: { type: Number, default: 30 },
    leave_days: { type: Number, default: 0 },

    generated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    generated_at: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

payslipSchema.index({ user_id: 1, month: 1, year: 1 }, { unique: true });

const Payslip = mongoose.model('Payslip', payslipSchema);
module.exports = Payslip;