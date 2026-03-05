const mongoose = require('mongoose');

const creditSchema = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    credit_date: { type: Date, default: Date.now },
    description: { type: String },
    given_by: { type: String }, // Can be a name or ID
    given_by_role: { type: String },
}, {
    timestamps: true,
});

const Credit = mongoose.model('Credit', creditSchema);
module.exports = Credit;
