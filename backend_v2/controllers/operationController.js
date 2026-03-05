const Payslip = require('../models/Payslip');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const Expense = require('../models/Expense');
const Holiday = require('../models/Holiday');
const Credit = require('../models/Credit');

// Payslips
const createPayslip = async (req, res) => {
    try {
        const payslip = await Payslip.create(req.body);
        res.status(201).json(payslip);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getMyPayslips = async (req, res) => {
    try {
        const payslips = await Payslip.find({ user_id: req.user._id });
        res.json(payslips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllPayslips = async (req, res) => {
    try {
        const payslips = await Payslip.find({}).populate('user_id', 'name email');
        res.json(payslips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLatestPayslip = async (req, res) => {
    try {
        const payslip = await Payslip.findOne({ user_id: req.params.userId }).sort({ createdAt: -1 });
        res.json(payslip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deletePayslip = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id);
        if (payslip) {
            await payslip.deleteOne();
            res.json({ message: 'Payslip removed' });
        } else {
            res.status(404).json({ message: 'Payslip not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Leave Requests
const createLeaveRequest = async (req, res) => {
    try {
        const request = await LeaveRequest.create({ ...req.body, user_id: req.user._id });
        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getMyLeaveRequests = async (req, res) => {
    try {
        const requests = await LeaveRequest.find({ user_id: req.user._id });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllLeaveRequests = async (req, res) => {
    try {
        const requests = await LeaveRequest.find({}).populate('user_id', 'name email');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLeaveStatus = async (req, res) => {
    try {
        const request = await LeaveRequest.findById(req.params.id);
        if (request) {
            request.status = req.body.status;
            request.reviewed_by = req.user._id;
            request.reviewed_at = Date.now();
            const updatedRequest = await request.save();
            res.json(updatedRequest);
        } else {
            res.status(404).json({ message: 'Leave request not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Attendance
const markAttendance = async (req, res) => {
    try {
        const { date, status, location, notes, user_id } = req.body;
        const targetUserId = (req.user.role === 'admin' && user_id) ? user_id : req.user._id;

        const attendance = await Attendance.findOneAndUpdate(
            { user_id: targetUserId, date },
            { status, location, notes, check_in: req.body.check_in || Date.now() },
            { upsert: true, returnDocument: 'after' }
        );
        res.status(201).json(attendance);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getMyAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find({ user_id: req.user._id });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find({}).populate('user_id', 'name email');
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id);
        if (attendance) {
            Object.assign(attendance, req.body);
            const updated = await attendance.save();
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Attendance record not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Expenses (Proxy/Internal)
const createExpense = async (req, res) => {
    try {
        const expense = await Expense.create({ ...req.body, user_id: req.user._id });
        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getMyExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ user_id: req.user._id });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllExpenses = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        const expenses = await Expense.find(filter).populate('user_id', 'name email');
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateExpenseStatus = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (expense) {
            expense.status = req.body.status;
            expense.reviewed_by = req.user._id;
            expense.reviewed_at = Date.now();
            const updated = await expense.save();
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Holidays
const getHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find({}).sort({ date: 1 });
        res.json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.create({ ...req.body, created_by: req.user._id });
        res.status(201).json(holiday);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Credits
const getMyCredits = async (req, res) => {
    try {
        const credits = await Credit.find({ user_id: req.user._id });
        res.json(credits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllCredits = async (req, res) => {
    try {
        const credits = await Credit.find({}).populate('user_id', 'name email');
        res.json(credits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createCredit = async (req, res) => {
    try {
        const credit = await Credit.create({ ...req.body, given_by: req.user._id });
        res.status(201).json(credit);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteCredit = async (req, res) => {
    try {
        const credit = await Credit.findById(req.params.id);
        if (credit) {
            await credit.deleteOne();
            res.json({ message: 'Credit removed' });
        } else {
            res.status(404).json({ message: 'Credit not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPayslip, getMyPayslips, getAllPayslips, getLatestPayslip, deletePayslip,
    createLeaveRequest, getMyLeaveRequests, getAllLeaveRequests, updateLeaveStatus,
    markAttendance, getMyAttendance, getAllAttendance, updateAttendance,
    createExpense, getMyExpenses, getAllExpenses, updateExpenseStatus,
    getHolidays, createHoliday,
    getMyCredits, getAllCredits, createCredit, deleteCredit
};
