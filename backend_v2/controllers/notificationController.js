const Notification = require('../models/Notification');

const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Not found' });
        
        if (notification.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMyNotifications, markAsRead };
