const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    const { name, email, password, role, employee_id, department, dob, base_salary, incentive_per_success } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'employee',
            employee_id: employee_id || null,
            department: department || null,
            dob: dob || null,
            base_salary: base_salary || null,
            incentive_per_success: incentive_per_success || null,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                employee_id: user.employee_id,
                department: user.department,
                dob: user.dob,
                is_active: user.is_active,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            // Block inactive users from logging in
            if (user.is_active === false) {
                return res.status(401).json({ 
                    message: 'Your account has been deactivated. Please contact your administrator.',
                    code: 'ACCOUNT_DEACTIVATED'
                });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                employee_id: user.employee_id,
                department: user.department,
                dob: user.dob,
                is_active: user.is_active,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            employee_id: user.employee_id,
            department: user.department,
            dob: user.dob,
            is_active: user.is_active,
            inactivated_at: user.inactivated_at,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// GET /api/users — admin only: get all employees
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/users/:id — admin only: update any user
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { name, email, role, employee_id, department, dob, base_salary, incentive_per_success, is_active } = req.body;

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (role !== undefined) user.role = role;
        if (employee_id !== undefined) user.employee_id = employee_id;
        if (department !== undefined) user.department = department;
        if (dob !== undefined) user.dob = dob;
        if (base_salary !== undefined) user.base_salary = base_salary;
        if (incentive_per_success !== undefined) user.incentive_per_success = incentive_per_success;

        // Handle is_active — pre-save hook will auto-set inactivated_at if set to false
        if (is_active !== undefined) {
            user.is_active = is_active;
            // If re-activating, clear inactivated_at
            if (is_active === true) {
                user.inactivated_at = null;
            }
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            employee_id: updatedUser.employee_id,
            department: updatedUser.department,
            dob: updatedUser.dob,
            base_salary: updatedUser.base_salary,
            incentive_per_success: updatedUser.incentive_per_success,
            is_active: updatedUser.is_active,
            inactivated_at: updatedUser.inactivated_at,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/users/:id — admin only
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, getUserProfile, getAllUsers, updateUser, deleteUser };