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
    is_active: {
        type: Boolean,
        default: true,
    },
    inactivated_at: {
        type: Date,
        default: null,
    },
    employee_id: {
        type: String,
        unique: true,
        sparse: true,
    },
    leads_count: {
        type: Number,
        default: 0,
    },
    department: {
        type: String,
        default: 'Other',
    },
    dob: {
        type: Date,
    },
}, {
    timestamps: true,
});

// Match user-entered password to hashed password in database
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save hook for inactivation tracking and password hashing
userSchema.pre('save', async function () {
    // Auto-set inactivated_at when is_active changes
    if (this.isModified('is_active')) {
        if (this.is_active === false) {
            this.inactivated_at = new Date();
        } else {
            this.inactivated_at = null;
        }
    }

    // Encrypt password if modified
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;