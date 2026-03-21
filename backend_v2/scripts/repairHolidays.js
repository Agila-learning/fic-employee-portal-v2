const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from grandparent dir
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const Attendance = require('../models/Attendance');
const Holiday = require('../models/Holiday');
const User = require('../models/User');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fic_employee_portal';

async function repairHolidays() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('Connected.');

        const holidays = await Holiday.find({});
        console.log(`Found ${holidays.length} holidays.`);

        const employees = await User.find({ role: 'employee' });
        console.log(`Found ${employees.length} employees.`);

        for (const holiday of holidays) {
            // Holiday date is a Date object. Convert to YYYY-MM-DD string.
            // Be careful with timezone. Use ISO string split.
            const dateStr = holiday.date.toISOString().split('T')[0];
            console.log(`Repairing holiday: ${holiday.name} (${dateStr})`);

            for (const emp of employees) {
                await Attendance.findOneAndUpdate(
                    { user_id: emp._id, date: dateStr },
                    {
                        $set: {
                            status: 'present',
                            notes: `Holiday: ${holiday.name}`
                        }
                    },
                    { upsert: true, new: true }
                );
            }
        }

        console.log('Repair completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Repair failed:', error);
        process.exit(1);
    }
}

repairHolidays();
