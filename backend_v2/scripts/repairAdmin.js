const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config({ path: '../.env' });

const repairAdmin = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fic_employee_portal';
        console.log('Connecting to:', mongoURI);
        await mongoose.connect(mongoURI);

        const email = 'forgeindiahr22@gmail.com';
        const password = 'Forgeindia@09';

        console.log('Cleaning up existing admin user...');
        await User.deleteMany({ email });

        console.log('Creating fresh admin user...');
        // We create the user manually to ensure we see exactly what goes in
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = new User({
            name: 'Forge India Admin',
            email: email,
            password: password,
            role: 'admin',
            is_active: true,
        });

        await admin.save();
        console.log('Admin user recreated successfully!');

        // Immediately verify
        const checkUser = await User.findOne({ email });
        const isMatch = await checkUser.comparePassword(password);

        console.log('--- Verification Result ---');
        console.log('Email:', checkUser.email);
        console.log('Hashed Password in DB:', checkUser.password);
        console.log('Password Comparison Test:', isMatch ? '✅ PASSED' : '❌ FAILED');

        if (!isMatch) {
            console.error('CRITICAL: Password comparison failed even after recreation. This suggests a bug in User.js pre-save hook or bcrypt version mismatch.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

repairAdmin();
