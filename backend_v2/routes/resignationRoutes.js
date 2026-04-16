const express = require('express');
const router = express.Router();
const { 
    submitResignation, 
    getMyResignation, 
    getAllResignations, 
    updateResignationStatus, 
    updateAssets, 
    finalizeResignation 
} = require('../controllers/resignationController');
const { protect, admin, hrManager } = require('../middleware/authMiddleware');

router.post('/', protect, submitResignation);
router.get('/my-resignation', protect, getMyResignation);

// HR Manager & Admin
router.get('/all', protect, hrManager, getAllResignations);
router.put('/:id/status', protect, hrManager, updateResignationStatus);
router.put('/:id/assets', protect, hrManager, updateAssets);

// Admin only finalization
router.put('/:id/finalize', protect, admin, finalizeResignation);

module.exports = router;
