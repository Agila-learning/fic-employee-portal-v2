const mongoose = require('mongoose');

const leadSchema = mongoose.Schema({
    candidate_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    qualification: { type: String },
    past_experience: { type: String },
    current_ctc: { type: String },
    expected_ctc: { type: String },
    status: {
        type: String,
        enum: ['nc1', 'nc2', 'nc3', 'follow_up', 'converted', 'success', 'rejected', 'not_interested', 'not_interested_paid', 'different_domain'],
        default: 'nc1'
    },
    source: { type: String },
    notes: { type: String },
    resume_url: { type: String },
    followup_date: { type: Date },
    followup_count: { type: Number, default: 0 },
    payment_slip_url: { type: String },
    payment_stage: {
        type: String,
        enum: ['registration_done', 'initial_payment_done', 'full_payment_done', null],
        default: null
    },
    interested_domain: {
        type: String,
        enum: ['it', 'non_it', 'banking'],
        default: 'it'
    },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: [{
        text: { type: String, required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        created_at: { type: Date, default: Date.now }
    }],
    status_history: [{
        old_status: String,
        new_status: String,
        changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changed_at: { type: Date, default: Date.now },
        notes: String
    }]
}, {
    timestamps: true,
});

const Lead = mongoose.model('Lead', leadSchema);
module.exports = Lead;