const mongoose = require('mongoose');

const attendanceRequestSchema = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    requested_status: {
        type: String,
        enum: ['present', 'half-day'],
        required: true,
        default: 'present'
    },
    reason: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewed_at: { type: Date }
}, {
    timestamps: true,
});

// Ensure only one pending request per user per date
attendanceRequestSchema.index({ user_id: 1, date: 1, status: 1 }, { 
    unique: true, 
    partialFilterExpression: { status: 'pending' } 
});

const AttendanceRequest = mongoose.model('AttendanceRequest', attendanceRequestSchema);
module.exports = AttendanceRequest;
