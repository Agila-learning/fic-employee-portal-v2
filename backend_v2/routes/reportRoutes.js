const express = require('express');
const router = express.Router();
const { createReport, getReports, deleteReport } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createReport)
    .get(protect, getReports);

router.delete('/:id', protect, admin, deleteReport);

module.exports = router;