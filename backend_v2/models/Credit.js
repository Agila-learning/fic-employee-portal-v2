const mongoose = require('mongoose');

const creditSchema = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    credit_date: { type: Date, default: Date.now },
    description: { type: String },
    given_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true,
});

const Credit = mongoose.model('Credit', creditSchema);
module.exports = Credit;
