const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: { type: String, required: true },
    type: { type: String, required: true }, // e.g. 'RESIGNATION', 'APPROVAL', 'ALERT'
    link: { type: String }, // e.g. '/employee/resignation-status'
    isRead: { type: Boolean, default: false },
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
