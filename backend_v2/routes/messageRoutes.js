const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, getChatList } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { upload, requireCloudinary } = require('../utils/cloudinary');

router.post('/send', protect, sendMessage);
router.get('/history/:otherUserId', protect, getMessages);
router.get('/list', protect, getChatList);

// Upload endpoint for chat attachments
router.post('/upload', protect, requireCloudinary, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        res.json({
            url: req.file.path,
            public_id: req.file.filename,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
