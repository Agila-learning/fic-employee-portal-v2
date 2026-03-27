const Policy = require('../models/Policy');

// @desc    Get all policies
// @route   GET /api/policies
// @access  Private
const getPolicies = async (req, res) => {
    try {
        const policies = await Policy.find({}).sort({ createdAt: -1 });
        res.json(policies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a policy
// @route   POST /api/policies
// @access  Private/Admin or Sub-Admin
const createPolicy = async (req, res) => {
    try {
        const { title, description, type, file_url, file_path, file_public_id } = req.body;
        const policy = await Policy.create({
            title,
            description,
            type,
            file_url,
            file_path,
            file_public_id,
            created_by: req.user._id
        });
        res.status(201).json(policy);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a policy
// @route   PUT /api/policies/:id
// @access  Private/Admin or Sub-Admin
const updatePolicy = async (req, res) => {
    try {
        const policy = await Policy.findById(req.params.id);
        if (policy) {
            policy.title = req.body.title || policy.title;
            policy.description = req.body.description || policy.description;
            policy.type = req.body.type || policy.type;
            policy.file_url = req.body.file_url !== undefined ? req.body.file_url : policy.file_url;
            policy.file_path = req.body.file_path !== undefined ? req.body.file_path : policy.file_path;
            policy.file_public_id = req.body.file_public_id !== undefined ? req.body.file_public_id : policy.file_public_id;
            policy.is_active = req.body.is_active !== undefined ? req.body.is_active : policy.is_active;

            const updatedPolicy = await policy.save();
            res.json(updatedPolicy);
        } else {
            res.status(404).json({ message: 'Policy not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a policy
// @route   DELETE /api/policies/:id
// @access  Private/Admin or Sub-Admin
const deletePolicy = async (req, res) => {
    try {
        const policy = await Policy.findById(req.params.id);
        if (policy) {
            await policy.deleteOne();
            res.json({ message: 'Policy removed' });
        } else {
            res.status(404).json({ message: 'Policy not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy
};
