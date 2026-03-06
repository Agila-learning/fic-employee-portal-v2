const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    check_in: { type: Date },
    check_out: { type: Date },
    duration_minutes: { type: Number }, // Stored on checkout
    status: {
        type: String,
        enum: ['present', 'absent', 'half-day', 'on-leave'],
        default: 'present'
    },
    location: { type: String },
    notes: { type: String }
}, {
    timestamps: true,
});

attendanceSchema.index({ user_id: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
