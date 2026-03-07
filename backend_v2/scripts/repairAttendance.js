const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
require('dotenv').config();

const repairAttendance = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fic_employee_portal';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected for repair...');

        const invalidRecords = await Attendance.find({
            $or: [
                { date: { $exists: false } },
                { date: '' },
                { date: null }
            ]
        });

        console.log(`Found ${invalidRecords.length} invalid records.`);

        let fixed = 0;
        let deleted = 0;

        for (const record of invalidRecords) {
            const dateObj = record.check_in || record.createdAt || new Date();
            const dateStr = dateObj.toISOString().split('T')[0];

            // Check if a valid record already exists for this user/date
            const existing = await Attendance.findOne({
                user_id: record.user_id,
                date: dateStr,
                _id: { $ne: record._id }
            });

            if (existing) {
                console.log(`Duplicate found for user ${record.user_id} on ${dateStr}. Deleting invalid record ${record._id}.`);
                await record.deleteOne();
                deleted++;
            } else {
                record.date = dateStr;
                await record.save();
                fixed++;
            }
        }

        console.log(`Repair completed. Fixed: ${fixed}, Deleted duplicates: ${deleted}`);
        process.exit(0);
    } catch (error) {
        console.error('Repair failed:', error);
        process.exit(1);
    }
};

repairAttendance();
