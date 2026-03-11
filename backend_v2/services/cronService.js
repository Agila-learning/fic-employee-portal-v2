const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

const initCronJobs = () => {
    // Run every day at 3:00 PM
    cron.schedule('0 15 * * *', async () => {
        console.log('Running Daily Attendance Check (3 PM)...');
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Get all active employees
            const activeEmployees = await User.find({ is_active: { $ne: false }, role: 'employee' });
            
            for (const employee of activeEmployees) {
                // 2. Check if attendance exists for today
                const attendance = await Attendance.findOne({
                    user_id: employee._id,
                    date: today
                });
                
                // 3. If no record, mark as absent
                if (!attendance) {
                    await Attendance.create({
                        user_id: employee._id,
                        date: today,
                        status: 'absent',
                        notes: 'Auto-marked absent (No check-in by 3 PM)'
                    });
                    console.log(`Marked ${employee.name} (${employee.employee_id}) as absent.`);
                }
            }
            console.log('Daily Attendance Check completed.');
        } catch (error) {
            console.error('Error in Daily Attendance Check:', error);
        }
    });

    console.log('Cron jobs initialized.');
};

module.exports = { initCronJobs };
