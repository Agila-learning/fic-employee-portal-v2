const mongoose = require('mongoose');

const monthlySalarySchema = mongoose.Schema({
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    amount: { type: Number, required: true },
    lopDays: { type: Number, default: 0 },
    lopAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Paid', 'Pending'], default: 'Paid' },
    paidDate: { type: Date, default: Date.now },
    remarks: { type: String }
});

const salaryDetailSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    employeeName: { type: String }, // Cached for convenience
    employeeId: { type: String }, // Cached for convenience
    ifscCode: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    location: { type: String },
    department: { type: String },
    joiningDate: { type: Date },
    totalSalary: { type: Number }, // CTC or Base
    
    monthlySalaries: [monthlySalarySchema]
}, {
    timestamps: true
});

const SalaryDetail = mongoose.model('SalaryDetail', salaryDetailSchema);
module.exports = SalaryDetail;
