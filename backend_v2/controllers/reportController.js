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
        const filter = (['admin', 'sub-admin', 'md', 'super-admin', 'hr_manager'].includes(req.user.role)) ? {} : { user_id: req.user._id };
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

const exportReports = async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;
        const filter = (['admin', 'sub-admin', 'md', 'super-admin', 'hr_manager'].includes(req.user.role)) ? {} : { user_id: req.user._id };
        
        if (startDate || endDate) {
            filter.report_date = {};
            if (startDate) filter.report_date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.report_date.$lte = end;
            }
        }
        
        if (department && department !== 'all') {
            filter.department = department;
        }

        const reports = await EmployeeReport.find(filter)
            .populate('user_id', 'name email employee_id')
            .sort({ report_date: -1 });

        // Generate CSV
        let csv = 'Date,Employee Name,Employee ID,Department,Morning Description,Afternoon Description,Candidates Screened\n';
        reports.forEach(report => {
            const date = report.report_date.toISOString().split('T')[0];
            const name = report.user_id?.name || 'Unknown';
            const empId = report.user_id?.employee_id || 'N/A';
            const dept = report.department;
            const morning = `"${report.morning_description.replace(/"/g, '""')}"`;
            const afternoon = `"${report.afternoon_description.replace(/"/g, '""')}"`;
            const screened = report.candidates_screened || 0;
            
            csv += `${date},${name},${empId},${dept},${morning},${afternoon},${screened}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=EmployeeReports_${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createReport, getReports, deleteReport, exportReports };
