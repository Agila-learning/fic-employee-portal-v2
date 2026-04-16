const mongoose = require('mongoose');

const assetSchema = mongoose.Schema({
    assetName: { type: String, required: true },
    issuedDate: { type: Date },
    returnStatus: { 
        type: String, 
        enum: ['Pending', 'Submitted'], 
        default: 'Pending' 
    },
    returnDate: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String }
});

const timelineSchema = mongoose.Schema({
    status: { type: String, required: true },
    remarks: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now }
});

const resignationSchema = mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: [
            'Submitted', 
            'HR Approved', 
            'CEO Approved', 
            'Rejected', 
            'Notice Active', 
            'Clearance Pending', 
            'Completed'
        ],
        default: 'Submitted'
    },
    appliedDate: { type: Date, default: Date.now },
    proposedLastWorkingDate: { type: Date, required: true },
    
    // Basic Reason
    reason: { type: String, required: true },
    customReason: { type: String },
    
    // Survey (Experience)
    experience: { type: String },
    whatLiked: { type: String },
    challenges: { type: String },
    clearResponsibilities: { type: String },
    properSupport: { type: String },
    workCultureRate: { type: String },
    growthRate: { type: String },
    managementRate: { type: String },
    salaryRate: { type: String },
    recommend: { type: String },
    
    // Feedback
    improveCulture: { type: String },
    improveManagement: { type: String },
    improveHR: { type: String },
    improveTraining: { type: String },
    finalFeedback: { type: String },
    
    // Achievements
    biggestAchievement: { type: String },
    keyProjects: { type: String },
    bestContribution: { type: String },
    awards: { type: String },
    skillsDeveloped: { type: String },
    
    // Handover
    startedKT: { type: Boolean, default: false },
    pendingTasks: { type: String },
    ongoingAssignments: { type: String },
    handoutPersonName: { type: String },
    clientDependencies: { type: String },
    transitionComments: { type: String },

    // Notice Period Tracking
    noticePeriod: {
        defaultDays: { type: Number, default: 30 },
        totalDays: { type: Number, default: 30 },
        completedDays: { type: Number, default: 0 },
        remainingDays: { type: Number, default: 30 },
        extraDaysAdded: { type: Number, default: 0 },
        expectedLastWorkingDate: { type: Date }
    },
    
    assets: [assetSchema],
    timeline: [timelineSchema],
    
    relievingLetterUrl: { type: String }
    
}, {
    timestamps: true
});

const Resignation = mongoose.model('Resignation', resignationSchema);
module.exports = Resignation;
