const express = require('express');
const router = express.Router();
const { 
    getSalaryDetails, 
    getSalaryDetailByUserId, 
    upsertSalaryDetail, 
    addMonthlySalary,
    deleteSalaryDetail 
} = require('../controllers/salaryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/all', protect, admin, getSalaryDetails);
router.get('/:userId', protect, getSalaryDetailByUserId);
router.post('/', protect, admin, upsertSalaryDetail);
router.put('/monthly', protect, admin, addMonthlySalary);
router.delete('/:id', protect, admin, deleteSalaryDetail);

module.exports = router;
