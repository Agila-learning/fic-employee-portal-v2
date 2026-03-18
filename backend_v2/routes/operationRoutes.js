const express = require('express');
const router = express.Router();
const {
    createPayslip, getMyPayslips, getAllPayslips, getLatestPayslip, deletePayslip,
    createLeaveRequest, getMyLeaveRequests, getAllLeaveRequests, updateLeaveStatus,
    markAttendance, getMyAttendance, getAllAttendance, updateAttendance, checkOut,
    createExpense, getMyExpenses, getAllExpenses, updateExpenseStatus, updateExpense, deleteExpense,
    getHolidays, createHoliday,
    getMyCredits, getAllCredits, createCredit, updateCredit, deleteCredit, deleteLeaveRequest
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
router.get('/attendance/range', protect, admin, getAllAttendance); // Frontend calls /range
router.patch('/attendance/checkout', protect, checkOut);
router.put('/attendance/:id', protect, admin, updateAttendance);

// Expenses
router.route('/expenses')
    .post(protect, createExpense)
    .get(protect, admin, getAllExpenses);
router.get('/expenses/my', protect, getMyExpenses);
router.put('/expenses/:id', protect, updateExpense);
router.put('/expenses/:id/status', protect, admin, updateExpenseStatus);
router.delete('/expenses/:id', protect, deleteExpense);

// Holidays
router.route('/holidays')
    .get(protect, getHolidays)
    .post(protect, admin, createHoliday);

// Credits
router.route('/credits')
    .get(protect, admin, getAllCredits)
    .post(protect, createCredit);
router.get('/credits/my', protect, getMyCredits);
router.put('/credits/:id', protect, admin, updateCredit);
router.delete('/credits/:id', protect, admin, deleteCredit);

// Admin: migrate existing payslips with missing employee_name/employee_id
router.post('/payslips/migrate-names', protect, admin, async (req, res) => {
    try {
        const Payslip = require('../models/Payslip');
        const User = require('../models/User');
        const payslips = await Payslip.find({
            $or: [
                { employee_name: { $exists: false } },
                { employee_name: '' },
                { employee_name: null }
            ]
        });
        let fixed = 0;
        for (const ps of payslips) {
            if (ps.user_id) {
                const user = await User.findById(ps.user_id);
                if (user) {
                    ps.employee_name = user.name;
                    if (!ps.employee_id) ps.employee_id = user.employee_id || '';
                    await ps.save();
                    fixed++;
                }
            }
        }
        res.json({ message: `Fixed ${fixed} of ${payslips.length} payslips` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

