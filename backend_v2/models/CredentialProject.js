const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
    title: { type: String, required: true },
    loginType: { 
        type: String, 
        enum: ['Email login', 'Mobile login', 'Username login', 'Custom login'],
        default: 'Email login'
    },
    email: { type: String },
    mobile: { type: String },
    username: { type: String },
    password: { type: String, required: true }, // Encrypted
    url: { type: String },
    role: { type: String },
    notes: { type: String },
    recoveryMail: { type: String },
    recoveryMobile: { type: String },
    customFields: { type: Map, of: String },
    isImportant: { type: Boolean, default: false }
}, { timestamps: true });

const attachmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String },
    url: { type: String, required: true },
    public_id: { type: String }, // For Cloudinary
    uploadDate: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const credentialProjectSchema = new mongoose.Schema({
    projectName: { type: String, required: true },
    clientName: { type: String },
    companyName: { type: String },
    projectType: { type: String },
    department: { type: String },
    status: { 
        type: String, 
        enum: ['Active', 'On Hold', 'Completed', 'Archived'],
        default: 'Active'
    },
    requirements: { type: String },
    attachments: [attachmentSchema],
    credentials: [credentialSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('CredentialProject', credentialProjectSchema);
