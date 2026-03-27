const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: '.env' });

const createSubAdmin = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fic_employee_portal';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const email = 'dharshan@fic.com';
        const password = 'fic123';

        let user = await User.findOne({ email });

        if (user) {
            console.log('User found, updating to sub-admin...');
            user.role = 'sub-admin';
            user.password = password;
            await user.save();
            console.log('User updated successfully!');
        } else {
            user = new User({
                name: 'Dharshan SubAdmin',
                email: email,
                password: password,
                role: 'sub-admin',
            });
            await user.save();
            console.log('Sub-Admin user created successfully!');
        }

        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating sub-admin:', error);
        process.exit(1);
    }
};

createSubAdmin();
