const express = require('express');
const router = express.Router();
const {
    getHolidays, createHoliday,
    getSuccessStories, createSuccessStory, updateSuccessStory, deleteSuccessStory,
    getAnnouncements, createAnnouncement, updateAnnouncementStatus, deleteAnnouncement,
    getTasks, createTask, updateTaskStatus, deleteTask
} = require('../controllers/utilityController');
const { protect, admin } = require('../middleware/authMiddleware');
const { cloudinary } = require('../utils/cloudinary');

router.route('/holidays')
    .get(protect, getHolidays)
    .post(protect, admin, createHoliday);

router.route('/success-stories')
    .get(protect, getSuccessStories)
    .post(protect, admin, createSuccessStory);

router.route('/success-stories/:id')
    .put(protect, admin, updateSuccessStory)
    .delete(protect, admin, deleteSuccessStory);

router.route('/announcements')
    .get(protect, getAnnouncements)
    .post(protect, admin, createAnnouncement);

router.route('/announcements/:id')
    .put(protect, admin, updateAnnouncementStatus)
    .delete(protect, admin, deleteAnnouncement);

router.route('/tasks')
    .get(protect, getTasks)
    .post(protect, admin, createTask);

router.route('/tasks/:id')
    .put(protect, updateTaskStatus)
    .delete(protect, admin, deleteTask);

// Direct upload signature for browser-to-Cloudinary uploads (bypasses Vercel 4.5MB proxy limit)
router.post('/cloudinary-signature', protect, (req, res) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = req.body.folder || 'fic-portal';
    const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        process.env.CLOUDINARY_API_SECRET
    );
    res.json({
        signature,
        timestamp,
        folder,
        api_key: process.env.CLOUDINARY_API_KEY,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    });
});

module.exports = router;
