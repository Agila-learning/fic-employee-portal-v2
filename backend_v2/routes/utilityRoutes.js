const express = require('express');
const router = express.Router();
const { getHolidays, createHoliday, getSuccessStories, createSuccessStory, updateSuccessStory, deleteSuccessStory } = require('../controllers/utilityController');
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

module.exports = router;