const Payslip = require('../models/Payslip.js');
const LeaveRequest = require('../models/LeaveRequest.js');
const Attendance = require('../models/Attendance.js');
const Expense = require('../models/Expense.js');
const Holiday = require('../models/Holiday.js');
const Credit = require('../models/Credit.js');
const User = require('../models/User.js');

// Payslips
const createPayslip = async (req, res) => {
    try {
        const { user_id, employee_name, employee_id } = req.body;
        // Always look up user to get authoritative name & employee_id
        const user = await User.findById(user_id);
        const finalName = (employee_name && employee_name.trim()) || (user && user.name) || 'Unknown';
        const finalEmpId = (employee_id && employee_id.trim()) || (user && user.employee_id) || '';

        const payslip = await Payslip.create({
            ...req.body,
            employee_name: finalName,
            employee_id: finalEmpId
        });
        res.status(201).json(payslip);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getMyPayslips = async (req, res) => {
    try {
        const payslips = await Payslip.find({ user_id: req.user._id }).populate('user_id', 'name email employee_id');
        res.json(payslips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllPayslips = async (req, res) => {
    try {
        const payslips = await Payslip.find({}).populate('user_id', 'name email employee_id');
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

const deleteLeaveRequest = async (req, res) => {
    try {
        const request = await LeaveRequest.findById(req.params.id);
        if (request) {
            // Check if user is owner or admin
            if (request.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to delete this request' });
            }
            // Optional: Only allow deletion if pending
            if (request.status !== 'pending' && req.user.role !== 'admin') {
                return res.status(400).json({ message: 'Cannot delete processed leave request' });
            }
            await request.deleteOne();
            res.json({ message: 'Leave request removed' });
        } else {
            res.status(404).json({ message: 'Leave request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Attendance
const markAttendance = async (req, res) => {
    try {
        const { date, status, location, notes, user_id, half_day, latitude, longitude, location_verified, work_location, face_photo } = req.body;
        const targetUserId = (req.user.role === 'admin' && user_id) ? user_id : req.user._id;
        const targetDate = date || new Date().toISOString().split('T')[0];

        const attendance = await Attendance.findOneAndUpdate(
            { user_id: targetUserId, date: targetDate },
            {
                status,
                location,
                notes,
                check_in: req.body.check_in || Date.now(),
                half_day,
                latitude,
                longitude,
                location_verified,
                work_location,
                face_photo
            },
            { upsert: true, returnDocument: 'after' }
        );
        res.status(201).json(attendance);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getMyAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find({ user_id: req.user._id }).sort({ date: -1 });
        const holidays = await Holiday.find({});
        
        // Enhance with virtual records for Sundays and Holidays missing from DB
        const enhancedAttendance = [...attendance];
        const existingDates = new Set(attendance.map(a => a.date));
        
        // Define a reasonable range (e.g., last 60 days) to fill gaps
        const now = new Date();
        for (let i = 0; i < 60; i++) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            if (!existingDates.has(dateStr)) {
                const dayOfWeek = d.getDay(); // 0 = Sunday
                const isHoliday = holidays.find(h => h.date.toISOString().split('T')[0] === dateStr);
                
                if (dayOfWeek === 0 || isHoliday) {
                    enhancedAttendance.push({
                        user_id: req.user._id,
                        date: dateStr,
                        status: 'present',
                        notes: dayOfWeek === 0 ? 'Sunday (Auto)' : `Holiday: ${isHoliday.name}`,
                        isVirtual: true // Mark as virtual for frontend handling
                    });
                }
            }
        }

        // Sort again since we pushed new records
        res.json(enhancedAttendance.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllAttendance = async (req, res) => {
    try {
        const { startDate, endDate, user_id } = req.query;
        const filter = {};
        if (user_id) filter.user_id = user_id;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = startDate;
            if (endDate) filter.date.$lte = endDate;
        }
        const attendance = await Attendance.find(filter)
            .populate('user_id', 'name email employee_id')
            .sort({ date: -1 });
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

// Check out - updates today's attendance with check_out time and duration
const checkOut = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({ user_id: req.user._id, date: today });

        if (!attendance) {
            return res.status(404).json({ message: 'No attendance record found for today. Please check in first.' });
        }
        if (!attendance.check_in) {
            return res.status(400).json({ message: 'No check-in time recorded for today.' });
        }
        if (attendance.check_out) {
            return res.status(400).json({ message: 'Already checked out for today.' });
        }

        const checkOutTime = new Date();
        const checkInTime = new Date(attendance.check_in);
        const durationMs = checkOutTime - checkInTime;
        const durationMins = Math.floor(durationMs / 60000);
        const hours = Math.floor(durationMins / 60);
        const mins = durationMins % 60;
        const durationStr = `${hours}h ${mins}m`;

        attendance.check_out = checkOutTime;
        attendance.duration_minutes = durationMins;
        if (req.body.work_location) attendance.location = (attendance.location || '') + '|checkout:' + req.body.work_location;
        const updated = await attendance.save();

        res.json({ ...updated.toObject(), duration: durationStr, duration_minutes: durationMins });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        const expenses = await Expense.find({ user_id: req.user._id }).sort({ expense_date: -1, createdAt: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllExpenses = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.approval_status = req.query.status;
        
        // Admin can see everything
        const expenses = await Expense.find(filter)
            .populate('user_id', 'name email role')
            .sort({ expense_date: -1, createdAt: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateExpenseStatus = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (expense) {
            expense.approval_status = req.body.status;
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

const updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (expense) {
            if (expense.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to update this expense' });
            }
            Object.assign(expense, req.body);
            const updated = await expense.save();
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (expense) {
            // Check if user is owner or admin
            if (expense.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to delete this expense' });
            }
            await expense.deleteOne();
            res.json({ message: 'Expense removed' });
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        const { name, date } = req.body;
        const holiday = await Holiday.create({ ...req.body, created_by: req.user._id });
        
        // Mark all employees as present for this holiday
        const employees = await User.find({ role: 'employee' });
        const holidayDate = new Date(date).toISOString().split('T')[0];
        
        for (const emp of employees) {
            await Attendance.findOneAndUpdate(
                { user_id: emp._id, date: holidayDate },
                { 
                    status: 'present', 
                    notes: `Holiday: ${name}`,
                    isVirtual: false // Mark as real record in DB
                },
                { upsert: true }
            );
        }
        
        res.status(201).json(holiday);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Credits
const getMyCredits = async (req, res) => {
    try {
        const credits = await Credit.find({ user_id: req.user._id }).sort({ credit_date: -1, createdAt: -1 });
        res.json(credits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllCredits = async (req, res) => {
    try {
        const credits = await Credit.find({})
            .populate('user_id', 'name email')
            .sort({ credit_date: -1, createdAt: -1 });
        res.json(credits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createCredit = async (req, res) => {
    try {
        const { amount, credit_date, description, given_by, given_by_role, user_id } = req.body;
        // If admin is adding, it might be for a specific user
        const targetUserId = (req.user.role === 'admin' && user_id) ? user_id : (req.user ? req.user._id : null);

        if (!targetUserId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const credit = await Credit.create({
            user_id: targetUserId,
            amount,
            credit_date: credit_date || Date.now(),
            description,
            given_by: given_by || req.user.name,
            given_by_role: given_by_role || req.user.role
        });
        res.status(201).json(credit);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateCredit = async (req, res) => {
    try {
        const credit = await Credit.findById(req.params.id);
        if (credit) {
            if (credit.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to update this credit' });
            }
            Object.assign(credit, req.body);
            const updated = await credit.save();
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Credit not found' });
        }
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
    createLeaveRequest, getMyLeaveRequests, getAllLeaveRequests, updateLeaveStatus, deleteLeaveRequest,
    markAttendance, getMyAttendance, getAllAttendance, updateAttendance, checkOut,
    createExpense, getMyExpenses, getAllExpenses, updateExpenseStatus, updateExpense, deleteExpense,
    getHolidays, createHoliday,
    getMyCredits, getAllCredits, createCredit, updateCredit, deleteCredit
};
