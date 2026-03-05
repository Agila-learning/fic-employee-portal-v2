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
        const story = await SuccessStory.create({ ...req.body, created_by: req.user._id });
        res.status(201).json(story);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateSuccessStory = async (req, res) => {
    try {
        const story = await SuccessStory.findById(req.params.id);
        if (story) {
            Object.assign(story, req.body);
            const updated = await story.save();
            res.json(updated);
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
        const announcements = await Announcement.find({}).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.create({ ...req.body, created_by: req.user._id });
        res.status(201).json(announcement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getTasks = async (req, res) => {
    try {
        let predicate = {};
        if (req.user.role !== 'admin') {
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
    getTasks, createTask, updateTaskStatus
};