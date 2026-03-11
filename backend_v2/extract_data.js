const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Attendance = require('./models/Attendance');
const User = require('./models/User');
const Expense = require('./models/Expense');
const Credit = require('./models/Credit');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const today = new Date().toISOString().split('T')[0];
        
        const attendance = await Attendance.find({ date: today }).populate('user_id', 'name');
        const expenses = await Expense.find({ approval_status: 'approved' });
        const credits = await Credit.find();

        console.log('\n--- DATA EXTRACTION REPORT ---');
        console.log('Date:', today);
        console.log('Total Attendance Records:', attendance.length);
        
        console.log('\n--- Attendance Details ---');
        if (attendance.length === 0) {
            console.log('No attendance records for today.');
        } else {
            attendance.forEach(a => {
                const name = a.user_id?.name || 'Unknown User';
                console.log(`- ${name.padEnd(20)} | Status: ${a.status.padEnd(10)} | In: ${a.check_in || 'N/A'}`);
            });
        }

        console.log('\n--- Expenses Summary ---');
        const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const totalCred = credits.reduce((s, c) => s + (c.amount || 0), 0);
        console.log('Total Approved Expenses: ₹' + totalExp.toLocaleString());
        console.log('Total Credits:           ₹' + totalCred.toLocaleString());
        console.log('Available Balance:       ₹' + (totalCred - totalExp).toLocaleString());
        console.log('\n--- END OF REPORT ---');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error during extraction:', err);
        process.exit(1);
    }
}

run();
