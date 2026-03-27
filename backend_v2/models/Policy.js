const mongoose = require('mongoose');

const policySchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    type: {
        type: String,
        enum: ['company', 'hr'],
        required: true,
    },
    file_url: {
        type: String,
    },
    file_path: {
        type: String,
    },
    file_public_id: {
        type: String,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    is_active: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true,
});

const Policy = mongoose.model('Policy', policySchema);
module.exports = Policy;
