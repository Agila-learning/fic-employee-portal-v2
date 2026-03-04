const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: '../.env' });

const seedAdmin = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fic_employee_portal';
        await mongoose.connect(mongoURI);

        const adminEmail = 'forgeindiahr22@gmail.com';
        const adminPassword = 'Forgeindia@09';

        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin user found, updating password...');
            admin.password = adminPassword;
            await admin.save();
            console.log('Admin password updated successfully!');
        } else {
            admin = new User({
                name: 'Forge India Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
            });
            await admin.save();
            console.log('Admin user created successfully!');
        }

        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
