const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Holiday = require('../models/Holiday');
const Resignation = require('../models/Resignation');

const processNoticeExtension = async (employeeId) => {
    try {
        const activeResignation = await Resignation.findOne({
            employee: employeeId,
            status: 'Notice Active'
        });
        
        if (activeResignation) {
            // Add 1 extra day
            activeResignation.noticePeriod.extraDaysAdded = (activeResignation.noticePeriod.extraDaysAdded || 0) + 1;
            
            // Recalculate Expected Last Working Date
            if (activeResignation.noticePeriod.expectedLastWorkingDate) {
                const newDate = new Date(activeResignation.noticePeriod.expectedLastWorkingDate);
                newDate.setDate(newDate.getDate() + 1);
                activeResignation.noticePeriod.expectedLastWorkingDate = newDate;
            }
            
            await activeResignation.save();
            console.log(`Extended notice period for ${employeeId} due to absence.`);
        }
    } catch (err) {
        console.error('Error extending notice period:', err);
    }
};

const initCronJobs = () => {
    // Run every day at 3:00 PM
    cron.schedule('0 15 * * *', async () => {
        console.log('Running Daily Attendance Check (3 PM)...');
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Get all active employees
            const activeEmployees = await User.find({ is_active: { $ne: false }, role: 'employee' });
            
            const isSunday = new Date().getDay() === 0;
            const holiday = await Holiday.findOne({ date: today });
            
            for (const employee of activeEmployees) {
                // 2. Check if attendance exists for today
                const attendance = await Attendance.findOne({
                    user_id: employee._id,
                    date: today
                });
                
                // 3. Automated marking logic
                if (!attendance) {
                    if (isSunday || holiday) {
                        // Mark as present for Sundays and Holidays (Inbuilt Present)
                        await Attendance.create({
                            user_id: employee._id,
                            date: today,
                            status: 'present',
                            notes: isSunday ? 'Sunday (Inbuilt Present)' : `Holiday: ${holiday.name} (Inbuilt Present)`
                        });
                        console.log(`Auto-marked ${employee.name} as present (${isSunday ? 'Sunday' : 'Holiday'}).`);
                    } else {
                        // Mark as absent if neither Sunday nor Holiday and no record by 3 PM
                        await Attendance.create({
                            user_id: employee._id,
                            date: today,
                            status: 'absent',
                            notes: 'Auto-marked absent (No check-in by 3 PM)'
                        });
                        console.log(`Marked ${employee.name} (${employee.employee_id}) as absent.`);
                        await processNoticeExtension(employee._id);
                    }
                } else if (attendance.status === 'absent') {
                    // They were marked absent manually or previously
                    await processNoticeExtension(employee._id);
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
