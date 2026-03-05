const express = require('express');
const router = express.Router();
const {
    createPayslip, getMyPayslips, getAllPayslips, getLatestPayslip, deletePayslip,
    createLeaveRequest, getMyLeaveRequests, getAllLeaveRequests, updateLeaveStatus,
    markAttendance, getMyAttendance, getAllAttendance, updateAttendance,
    createExpense, getMyExpenses, getAllExpenses, updateExpenseStatus, deleteExpense,
    getHolidays, createHoliday,
    getMyCredits, getAllCredits, createCredit, deleteCredit, deleteLeaveRequest
} = require('../controllers/operationController');
const { protect, admin } = require('../middleware/authMiddleware');

// Payslips
router.route('/payslips')
    .post(protect, admin, createPayslip)
    .get(protect, admin, getAllPayslips);
router.get('/payslips/my', protect, getMyPayslips);
router.get('/payslips/latest/:userId', protect, getLatestPayslip);
router.delete('/payslips/:id', protect, admin, deletePayslip);

// Leave
router.route('/leave')
    .post(protect, createLeaveRequest)
    .get(protect, admin, getAllLeaveRequests);
router.get('/leave/my', protect, getMyLeaveRequests);
router.put('/leave/:id', protect, admin, updateLeaveStatus);
router.delete('/leave/:id', protect, deleteLeaveRequest);

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
router.delete('/expenses/:id', protect, deleteExpense);

// Holidays
router.route('/holidays')
    .get(protect, getHolidays)
    .post(protect, admin, createHoliday);

// Credits
router.route('/credits')
    .get(protect, admin, getAllCredits)
    .post(protect, admin, createCredit);
router.get('/credits/my', protect, getMyCredits);
router.delete('/credits/:id', protect, admin, deleteCredit);

module.exports = router;
