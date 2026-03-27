const express = require('express');
const router = express.Router();
const {
    getPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy
} = require('../controllers/policyController');
const { protect, subAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getPolicies)
    .post(protect, subAdmin, createPolicy);

router.route('/:id')
    .put(protect, subAdmin, updatePolicy)
    .delete(protect, subAdmin, deletePolicy);

module.exports = router;
