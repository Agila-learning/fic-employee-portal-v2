const Lead = require('../models/Lead');

const createLead = async (req, res) => {
    const lead = new Lead({
        ...req.body,
        branch: req.body.branch || req.user.branch || 'Chennai',
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
        const limit = parseInt(req.query.limit) || 0;
        let filter = {};
        if (req.user.role === 'super-admin') {
            filter = { branch: req.user.branch };
        } else if (['admin', 'sub-admin', 'md', 'hr_manager'].includes(req.user.role)) {
            filter = {};
        } else {
            filter = { $or: [{ assigned_to: req.user._id }, { created_by: req.user._id }] };
        }
        
        let query = Lead.find(filter)
            .populate('assigned_to', 'name email')
            .populate('created_by', 'name email')
            .sort({ updatedAt: -1 }); // Default to latest first

        if (limit > 0) {
            query = query.limit(limit);
        }

        const leads = await query;
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
            // Permission check: Admin or Creator or Assignee
            const isCreator = lead.created_by && lead.created_by.toString() === req.user._id.toString();
            const isAssignee = lead.assigned_to && lead.assigned_to.toString() === req.user._id.toString();

            if (['admin', 'sub-admin', 'md', 'hr_manager'].includes(req.user.role) || isCreator || isAssignee) {
                await lead.deleteOne();
                res.json({ message: 'Lead removed' });
            } else if (req.user.role === 'super-admin') {
                // Super admin can only delete leads from their own branch
                if (lead.branch === req.user.branch) {
                    await lead.deleteOne();
                    res.json({ message: 'Lead removed' });
                } else {
                    res.status(403).json({ message: 'Not authorized to delete leads from other branches' });
                }
            } else {
                res.status(401).json({ message: 'Not authorized to delete this lead' });
            }
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
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        res.json({
            url: req.file.path,
            public_id: req.file.filename,
            format: req.file.format
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const bulkUploadLeads = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const results = [];
        const csv = require('csv-parser');
        const stream = require('stream');
        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);

        bufferStream
            .pipe(csv())
            .on('data', (data) => {
                // Generate a candidate ID if not provided in CSV
                const candidate_id = data.candidate_id || 'FIC-' + Math.random().toString(36).substr(2, 6).toUpperCase();

                    results.push({
                        candidate_id,
                        name: data.name || data.full_name || 'Unknown',
                        email: data.email,
                        phone: data.phone || '0000000000',
                        qualification: data.qualification,
                        past_experience: data.past_experience,
                        current_ctc: data.current_ctc,
                        expected_ctc: data.expected_ctc,
                        status: data.status || 'nc1',
                        source: data.source || 'social_media',
                        notes: data.notes,
                        interested_domain: data.interested_domain || 'it',
                        branch: data.branch || req.user.branch || 'Chennai',
                        created_by: req.user._id,
                        assigned_to: data.assigned_to || null
                    });
            })
            .on('end', async () => {
                try {
                    const createdLeads = await Lead.insertMany(results);
                    res.status(201).json({
                        message: `${createdLeads.length} leads uploaded successfully`,
                        count: createdLeads.length
                    });
                } catch (err) {
                    res.status(400).json({ message: 'Error saving leads: ' + err.message });
                }
            });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSignedUrl = async (req, res) => {
    // Cloudinary URLs are public by default in this config, or we can use private CDN
    res.json({ url: req.query.path });
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
    getSignedUrl,
    bulkUploadLeads
};
