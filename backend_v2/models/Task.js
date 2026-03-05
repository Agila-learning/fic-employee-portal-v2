const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    assigned_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending',
    },
    due_date: {
        type: Date,
    }
}, {
    timestamps: true,
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
