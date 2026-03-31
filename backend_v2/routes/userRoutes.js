const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updatePassword, getUsers, updateUser, deleteUser } = require('../controllers/userController');
const { protect, admin, subAdmin } = require('../middleware/authMiddleware');

router.post('/register', protect, admin, registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/update-password', protect, updatePassword);

router.route('/')
    .get(protect, getUsers);

router.route('/:id')
    .put(protect, admin, updateUser)
    .delete(protect, admin, deleteUser);

module.exports = router;
