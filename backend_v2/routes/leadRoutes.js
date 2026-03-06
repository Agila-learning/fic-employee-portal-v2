const express = require('express');
const router = express.Router();
const {
    createLead,
    getLeads,
    updateLead,
    deleteLead,
    getComments,
    addComment,
    getStatusHistory,
    logAccess,
    generateUniqueId,
    uploadFile,
    getSignedUrl,
    bulkUploadLeads
} = require('../controllers/leadController');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload, requireCloudinary } = require('../utils/cloudinary');
const multer = require('multer');
const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({ storage: memoryStorage });

router.route('/')
    .post(protect, createLead)
    .get(protect, getLeads);

router.get('/generate-id', protect, generateUniqueId);
router.post('/audit', protect, logAccess);
router.post('/upload', protect, requireCloudinary, upload.single('file'), uploadFile);
router.post('/bulk-upload', protect, admin, memoryUpload.single('file'), bulkUploadLeads);
router.get('/signed-url', protect, getSignedUrl);

router.route('/:id')
    .put(protect, updateLead)
    .delete(protect, admin, deleteLead);

router.route('/:id/comments')
    .get(protect, getComments)
    .post(protect, addComment);

router.get('/:id/history', protect, getStatusHistory);

module.exports = router;
