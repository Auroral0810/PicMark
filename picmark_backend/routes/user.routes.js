const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 所有用户路由都需要认证
router.use(protect);

// 更新用户信息 PUT /api/users/profile
router.put('/profile', userController.updateUser);

module.exports = router; 