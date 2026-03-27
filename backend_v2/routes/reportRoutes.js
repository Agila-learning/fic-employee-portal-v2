const express = require('express');
const router = express.Router();
const { createReport, getReports, deleteReport } = require('../controllers/reportController');
const { protect, admin, subAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createReport)
    .get(protect, getReports);

router.delete('/:id', protect, subAdmin, deleteReport);

module.exports = router;