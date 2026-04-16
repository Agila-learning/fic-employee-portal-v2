const SalaryDetail = require('../models/SalaryDetail');
const User = require('../models/User');

const getSalaryDetails = async (req, res) => {
    try {
        const salaryDetails = await SalaryDetail.find().populate('user', 'name email employee_id department');
        res.json(salaryDetails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSalaryDetailByUserId = async (req, res) => {
    try {
        const salaryDetail = await SalaryDetail.findOne({ user: req.params.userId }).populate('user', 'name email employee_id department');
        if (!salaryDetail) {
            return res.status(404).json({ message: 'Salary details not found for this user' });
        }
        res.json(salaryDetail);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const upsertSalaryDetail = async (req, res) => {
    try {
        const { userId, ifscCode, bankName, accountNumber, location, department, joiningDate, totalSalary } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let salaryDetail = await SalaryDetail.findOne({ user: userId });

        if (salaryDetail) {
            salaryDetail.ifscCode = ifscCode || salaryDetail.ifscCode;
            salaryDetail.bankName = bankName || salaryDetail.bankName;
            salaryDetail.accountNumber = accountNumber || salaryDetail.accountNumber;
            salaryDetail.location = location || salaryDetail.location;
            salaryDetail.department = department || salaryDetail.department;
            salaryDetail.joiningDate = joiningDate || salaryDetail.joiningDate;
            salaryDetail.totalSalary = totalSalary || salaryDetail.totalSalary;
            salaryDetail.employeeName = user.name;
            salaryDetail.employeeId = user.employee_id;
        } else {
            salaryDetail = new SalaryDetail({
                user: userId,
                employeeName: user.name,
                employeeId: user.employee_id,
                ifscCode,
                bankName,
                accountNumber,
                location,
                department,
                joiningDate,
                totalSalary
            });
        }

        const savedDetail = await salaryDetail.save();
        res.json(savedDetail);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addMonthlySalary = async (req, res) => {
    try {
        const { userId, month, year, amount, lopDays, lopAmount, status, remarks } = req.body;
        
        let salaryDetail = await SalaryDetail.findOne({ user: userId });
        if (!salaryDetail) {
            return res.status(404).json({ message: 'Salary credentials must be set before adding monthly salary' });
        }

        // Check if month/year already exists
        const exists = salaryDetail.monthlySalaries.find(s => s.month === parseInt(month) && s.year === parseInt(year));
        if (exists) {
            return res.status(400).json({ message: `Salary record for ${month}/${year} already exists.` });
        }

        salaryDetail.monthlySalaries.push({
            month: parseInt(month),
            year: parseInt(year),
            amount: parseFloat(amount),
            lopDays: parseFloat(lopDays) || 0,
            lopAmount: parseFloat(lopAmount) || 0,
            status: status || 'Paid',
            remarks: remarks || ''
        });

        const updatedDetail = await salaryDetail.save();
        res.json(updatedDetail);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteSalaryDetail = async (req, res) => {
    try {
        const salaryDetail = await SalaryDetail.findById(req.params.id);
        if (salaryDetail) {
            await salaryDetail.deleteOne();
            res.json({ message: 'Salary detail removed' });
        } else {
            res.status(404).json({ message: 'Salary detail not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSalaryDetails,
    getSalaryDetailByUserId,
    upsertSalaryDetail,
    addMonthlySalary,
    deleteSalaryDetail
};
