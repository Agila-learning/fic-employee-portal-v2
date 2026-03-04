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
    getSignedUrl 
} = require('../controllers/leadController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createLead)
    .get(protect, getLeads);

router.get('/generate-id', protect, generateUniqueId);
router.post('/audit', protect, logAccess);
router.post('/upload', protect, uploadFile);
router.get('/signed-url', protect, getSignedUrl);

router.route('/:id')
    .put(protect, updateLead)
    .delete(protect, admin, deleteLead);

router.route('/:id/comments')
    .get(protect, getComments)
    .post(protect, addComment);

router.get('/:id/history', protect, getStatusHistory);

module.exports = router;
