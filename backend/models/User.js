const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'employee', 'md', 'sub-admin', 'hr_manager'],
        default: 'employee',
    },
    employee_id: {
        type: String,
        default: null,
    },
    department: {
        type: String,
        default: null,
    },
    dob: {
        type: Date,
        default: null,
    },
    base_salary: {
        type: Number,
        default: null,
    },
    incentive_per_success: {
        type: Number,
        default: null,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    inactivated_at: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

// Match user-entered password to hashed password in database
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Auto-set inactivated_at when is_active changes to false
userSchema.pre('save', function (next) {
    if (this.isModified('is_active') && this.is_active === false) {
        this.inactivated_at = new Date();
    }
    next();
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;