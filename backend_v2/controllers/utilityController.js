const Holiday = require('../models/Holiday');
const SuccessStory = require('../models/SuccessStory');
const Announcement = require('../models/Announcement');
const Task = require('../models/Task');

const getHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find({});
        res.json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.create({ ...req.body, created_by: req.user._id });
        res.status(201).json(holiday);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getSuccessStories = async (req, res) => {
    try {
        const stories = await SuccessStory.find({});
        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createSuccessStory = async (req, res) => {
    try {
        const { candidate_name, package: package_val, location, domain, motivation_words, video_url, video_path } = req.body;
        const story = await SuccessStory.create({
            candidate_name,
            package: package_val,
            location,
            domain,
            motivation_words,
            video_url,
            video_path,
            created_by: req.user._id
        });
        res.status(201).json(story);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateSuccessStory = async (req, res) => {
    try {
        const { candidate_name, package: package_val, location, domain, motivation_words, video_url, video_path } = req.body;
        const story = await SuccessStory.findById(req.params.id);
        if (story) {
            story.candidate_name = candidate_name || story.candidate_name;
            story.package = package_val !== undefined ? package_val : story.package;
            story.location = location || story.location;
            story.domain = domain || story.domain;
            story.motivation_words = motivation_words || story.motivation_words;
            story.video_url = video_url !== undefined ? video_url : story.video_url;
            story.video_path = video_path !== undefined ? video_path : story.video_path;
            const updatedStory = await story.save();
            res.json(updatedStory);
        } else {
            res.status(404).json({ message: 'Success story not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteSuccessStory = async (req, res) => {
    try {
        const story = await SuccessStory.findById(req.params.id);
        if (story) {
            await story.deleteOne();
            res.json({ message: 'Success story removed' });
        } else {
            res.status(404).json({ message: 'Success story not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAnnouncements = async (req, res) => {
    try {
        const { branch } = req.query;
        let filter = {};

        // If a specific branch is requested by an authorized user
        if (branch && branch !== 'All' && ['admin', 'md', 'sub-admin', 'hr_manager', 'super-admin'].includes(req.user?.role)) {
            filter = { branch: { $in: [branch, 'All'] } };
        } else if (req.user?.role === 'super-admin') {
            filter = { branch: { $in: [req.user.branch, 'All'] } };
        } else {
            // General filter for employees: show their branch + 'All'
            filter = { $or: [{ branch: 'All' }] };
            if (req.user && req.user.branch && req.user.branch !== 'All') {
                filter.$or.push({ branch: req.user.branch });
            }
        }
        
        const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.create({ 
            ...req.body, 
            created_by: req.user._id,
            branch: req.body.branch || req.user.branch || 'All'
        });
        res.status(201).json(announcement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getTasks = async (req, res) => {
    try {
        let predicate = {};
        const { branch } = req.query;
        const User = require('../models/User'); // Ensure User model is available

        if (req.user.role === 'super-admin') {
            const usersInBranch = await User.find({ branch: req.user.branch }).select('_id');
            const userIds = usersInBranch.map(u => u._id);
            predicate = { assigned_to: { $in: userIds } };
        } else if (branch && branch !== 'All' && ['admin', 'md', 'sub-admin', 'hr_manager'].includes(req.user.role)) {
            const usersInBranch = await User.find({ branch }).select('_id');
            const userIds = usersInBranch.map(u => u._id);
            predicate = { assigned_to: { $in: userIds } };
        } else if (!['admin', 'sub-admin', 'md', 'hr_manager'].includes(req.user.role)) {
            predicate = { assigned_to: req.user._id };
        }
        const tasks = await Task.find(predicate).populate('assigned_to', 'name email').sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createTask = async (req, res) => {
    try {
        const task = await Task.create({ ...req.body, assigned_by: req.user._id });
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateTaskStatus = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (task) {
            task.status = req.body.status || task.status;
            const updated = await task.save();
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (task) {
            await task.deleteOne();
            res.json({ message: 'Task removed' });
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (announcement) {
            await announcement.deleteOne();
            res.json({ message: 'Announcement removed' });
        } else {
            res.status(404).json({ message: 'Announcement not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateAnnouncementStatus = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (announcement) {
            announcement.is_active = req.body.is_active !== undefined ? req.body.is_active : announcement.is_active;
            const updated = await announcement.save();
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Announcement not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getHolidays, createHoliday,
    getSuccessStories, createSuccessStory, updateSuccessStory, deleteSuccessStory,
    getAnnouncements, createAnnouncement, updateAnnouncementStatus, deleteAnnouncement,
    getTasks, createTask, updateTaskStatus, deleteTask
};