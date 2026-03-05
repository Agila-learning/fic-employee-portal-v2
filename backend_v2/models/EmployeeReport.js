const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    report_date: { type: Date, required: true },
    department: {
        type: String,
        required: true
    },
    morning_description: { type: String, required: true },
    afternoon_description: { type: String, required: true },
    candidates_screened: { type: Number, default: 0 },
}, {
    timestamps: true,
});

reportSchema.index({ user_id: 1, report_date: 1 }, { unique: true });

const EmployeeReport = mongoose.model('EmployeeReport', reportSchema);
module.exports = EmployeeReport;