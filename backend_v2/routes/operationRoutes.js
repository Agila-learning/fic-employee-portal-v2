const express = require('express');
const router = express.Router();
const { 
    createPayslip, getMyPayslips, getAllPayslips, 
    createLeaveRequest, getMyLeaveRequests, getAllLeaveRequests, updateLeaveStatus,
    markAttendance, getMyAttendance, getAllAttendance, updateAttendance,
    createExpense, getMyExpenses, getAllExpenses, updateExpenseStatus
} = require('../controllers/operationController');
const { protect, admin } = require('../middleware/authMiddleware');

// Payslips
router.route('/payslips')
    .post(protect, admin, createPayslip)
    .get(protect, admin, getAllPayslips);
router.get('/payslips/my', protect, getMyPayslips);

// Leave
router.route('/leave')
    .post(protect, createLeaveRequest)
    .get(protect, admin, getAllLeaveRequests);
router.get('/leave/my', protect, getMyLeaveRequests);
router.put('/leave/:id', protect, admin, updateLeaveStatus);

// Attendance
router.route('/attendance')
    .post(protect, markAttendance)
    .get(protect, admin, getAllAttendance);
router.get('/attendance/my', protect, getMyAttendance);
router.put('/attendance/:id', protect, admin, updateAttendance);

// Expenses
router.route('/expenses')
    .post(protect, createExpense)
    .get(protect, admin, getAllExpenses);
router.get('/expenses/my', protect, getMyExpenses);
router.put('/expenses/:id/status', protect, admin, updateExpenseStatus);

module.exports = router;
