const express = require('express');
const router = express.Router();
const {
    getHolidays, createHoliday,
    getSuccessStories, createSuccessStory, updateSuccessStory, deleteSuccessStory,
    getAnnouncements, createAnnouncement, updateAnnouncementStatus, deleteAnnouncement,
    getTasks, createTask, updateTaskStatus, deleteTask
} = require('../controllers/utilityController');
const { protect, admin, subAdmin } = require('../middleware/authMiddleware');
const { cloudinary, upload, requireCloudinary } = require('../utils/cloudinary');

router.route('/holidays')
    .get(protect, getHolidays)
    .post(protect, subAdmin, createHoliday);

router.route('/success-stories')
    .get(protect, getSuccessStories)
    .post(protect, subAdmin, createSuccessStory);

router.route('/success-stories/:id')
    .put(protect, subAdmin, updateSuccessStory)
    .delete(protect, subAdmin, deleteSuccessStory);

router.route('/announcements')
    .get(protect, getAnnouncements)
    .post(protect, subAdmin, createAnnouncement);

router.route('/announcements/:id')
    .put(protect, subAdmin, updateAnnouncementStatus)
    .delete(protect, subAdmin, deleteAnnouncement);

router.route('/tasks')
    .get(protect, getTasks)
    .post(protect, subAdmin, createTask);

router.route('/tasks/:id')
    .put(protect, updateTaskStatus)
    .delete(protect, subAdmin, deleteTask);

// Direct video upload for success stories via Cloudinary multer (same as /leads/upload)
router.post('/upload-video', protect, admin, requireCloudinary, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        res.json({
            url: req.file.path,
            public_id: req.file.filename,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cloudinary signature for direct browser uploads (for future use when EC2 has HTTPS)
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
