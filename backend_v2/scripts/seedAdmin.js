const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: '../.env' });

const seedAdmin = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fic_employee_portal';
        await mongoose.connect(mongoURI);

        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        const admin = new User({
            name: 'Forge India Admin',
            email: 'forgeindiahr22@gmail.com',
            password: 'Forgeindia@09',
            role: 'admin',
        });

        await admin.save();
        console.log('Admin user seeded successfully!');
        console.log('Email: forgeindiahr22@gmail.com');
        console.log('Password: Forgeindia@09');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
