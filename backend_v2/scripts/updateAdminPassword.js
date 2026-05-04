const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const updateAdminPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'forgeindiahr22@gmail.com';
        const newPassword = 'Forgeindia@07';

        const user = await User.findOne({ email: adminEmail });
        if (!user) {
            console.log('Admin user not found');
            process.exit(1);
        }

        user.password = newPassword;
        await user.save();

        console.log(`Password for ${adminEmail} updated successfully to ${newPassword}`);
        process.exit(0);
    } catch (error) {
        console.error('Error updating password:', error);
        process.exit(1);
    }
};

updateAdminPassword();
