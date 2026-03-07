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
    half_day: { type: Boolean, default: false },
    latitude: { type: Number },
    longitude: { type: Number },
    location_verified: { type: Boolean, default: false },
    work_location: { type: String },
    face_photo: { type: String }, // Store as URL or reference
    location: { type: String },
    notes: { type: String }
}, {
    timestamps: true,
});

attendanceSchema.index({ user_id: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
