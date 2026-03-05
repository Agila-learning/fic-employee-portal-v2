const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema({
    expense_date: { type: Date, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    receipt_url: { type: String },
    approval_status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true,
});

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;