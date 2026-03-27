const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

dotenv.config({ path: '.env' });

const debugUser = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fic_employee_portal';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const email = 'dharshan@fic.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User NOT found');
        } else {
            console.log('User found:');
            console.log('ID:', user._id);
            console.log('Role:', user.role);
            console.log('Email:', user.email);
            console.log('Hashed Password:', user.password);
            
            const isMatch = await bcrypt.compare('fic123', user.password);
            console.log('Password Match for "fic123":', isMatch);
        }
        process.exit(0);
    } catch (error) {
        console.error('Error debugging user:', error);
        process.exit(1);
    }
};

debugUser();
