const express = require('express');
const router = express.Router();
const {
    getHolidays, createHoliday,
    getSuccessStories, createSuccessStory, updateSuccessStory, deleteSuccessStory,
    getAnnouncements, createAnnouncement, updateAnnouncementStatus, deleteAnnouncement,
    getTasks, createTask, updateTaskStatus
} = require('../controllers/utilityController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/holidays')
    .get(protect, getHolidays)
    .post(protect, admin, createHoliday);

router.route('/success-stories')
    .get(protect, getSuccessStories)
    .post(protect, admin, createSuccessStory);

router.route('/success-stories/:id')
    .put(protect, admin, updateSuccessStory)
    .delete(protect, admin, deleteSuccessStory);

router.route('/announcements')
    .get(protect, getAnnouncements)
    .post(protect, admin, createAnnouncement);

router.route('/announcements/:id')
    .put(protect, admin, updateAnnouncementStatus)
    .delete(protect, admin, deleteAnnouncement);

router.route('/tasks')
    .get(protect, getTasks)
    .post(protect, admin, createTask);

router.route('/tasks/:id')
    .put(protect, updateTaskStatus);

module.exports = router;