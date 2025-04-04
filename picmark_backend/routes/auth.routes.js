const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 用户注册 POST /api/auth/register
router.post(
  '/register',
  [
    check('username', '用户名必须至少包含3个字符').isLength({ min: 3 }),
    check('email', '请提供有效的电子邮件').isEmail(),
    check('password', '密码必须至少包含6个字符').isLength({ min: 6 })
  ],
  userController.registerUser
);

// 用户登录 POST /api/auth/login
router.post('/login', userController.loginUser);

// 获取当前用户 GET /api/auth/me
router.get('/me', protect, userController.getCurrentUser);

// 修改密码 PUT /api/auth/password
router.put('/password', protect, userController.changePassword);

module.exports = router; 