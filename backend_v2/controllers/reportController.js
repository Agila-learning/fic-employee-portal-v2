const EmployeeReport = require('../models/EmployeeReport');

const createReport = async (req, res) => {
    const { report_date, department, morning_description, afternoon_description, candidates_screened } = req.body;
    try {
        const report = await EmployeeReport.create({
            user_id: req.user._id,
            report_date,
            department,
            morning_description,
            afternoon_description,
            candidates_screened: candidates_screened || 0
        });
        res.status(201).json(report);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Report already submitted for this date' });
        }
        res.status(400).json({ message: error.message });
    }
};

const getReports = async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { user_id: req.user._id };
        const reports = await EmployeeReport.find(filter)
            .populate('user_id', 'name email')
            .sort({ report_date: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteReport = async (req, res) => {
    try {
        const report = await EmployeeReport.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });
        await report.deleteOne();
        res.json({ message: 'Report deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createReport, getReports, deleteReport };
