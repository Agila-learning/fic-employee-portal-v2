const Lead = require('../models/Lead');

const createLead = async (req, res) => {
    const lead = new Lead({
        ...req.body,
        created_by: req.user._id,
    });
    try {
        const createdLead = await lead.save();
        res.status(201).json(createdLead);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getLeads = async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { assigned_to: req.user._id };
        const leads = await Lead.find(filter).populate('assigned_to', 'name email');
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (lead) {
            Object.assign(lead, req.body);
            const updatedLead = await lead.save();
            res.json(updatedLead);
        } else {
            res.status(404).json({ message: 'Lead not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (lead) {
            await lead.deleteOne();
            res.json({ message: 'Lead removed' });
        } else {
            res.status(404).json({ message: 'Lead not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getComments = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (lead) {
            res.json(lead.comments || []);
        } else {
            res.status(404).json({ message: 'Lead not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addComment = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (lead) {
            const comment = {
                text: req.body.comment,
                author: req.user._id,
                created_at: Date.now()
            };
            if (!lead.comments) lead.comments = [];
            lead.comments.push(comment);
            await lead.save();
            res.status(201).json(comment);
        } else {
            res.status(404).json({ message: 'Lead not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getStatusHistory = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (lead) {
            res.json(lead.status_history || []);
        } else {
            res.status(404).json({ message: 'Lead not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const logAccess = async (req, res) => {
    res.json({ message: 'Access logged' });
};

const generateUniqueId = async (req, res) => {
    const id = 'FIC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    res.json({ id });
};

const uploadFile = async (req, res) => {
    res.json({ message: 'File upload endpoint (placeholder)' });
};

const getSignedUrl = async (req, res) => {
    res.json({ url: '#' });
};

module.exports = { 
    createLead, 
    getLeads, 
    updateLead, 
    deleteLead, 
    getComments, 
    addComment, 
    getStatusHistory, 
    logAccess, 
    generateUniqueId, 
    uploadFile, 
    getSignedUrl 
};
