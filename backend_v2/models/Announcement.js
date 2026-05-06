const mongoose = require('mongoose');

const announcementSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    branch: {
        type: String,
        enum: ['Chennai', 'Bangalore', 'Thirupattur', 'Krishnagiri', 'All'],
        default: 'All',
    }
}, {
    timestamps: true,
});

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;
