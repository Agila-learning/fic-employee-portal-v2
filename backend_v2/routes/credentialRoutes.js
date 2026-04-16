const express = require('express');
const router = express.Router();
const {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject
} = require('../controllers/credentialController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes are protected and restricted to admin/md
router.use(protect);
router.use(admin);

router.route('/')
    .get(getProjects)
    .post(createProject);

router.route('/:id')
    .get(getProject)
    .put(updateProject)
    .delete(deleteProject);

module.exports = router;
