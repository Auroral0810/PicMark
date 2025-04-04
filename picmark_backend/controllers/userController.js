const User = require('../models/user.model');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// 生成JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// 注册用户
exports.registerUser = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { username, email, password } = req.body;

    // 检查用户名和邮箱是否已存在
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名或邮箱已被注册' 
      });
    }

    // 创建新用户
    const user = await User.create({
      username,
      email,
      password
    });

    // 生成token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('注册用户失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 用户登录
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证请求
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供用户名和密码' 
      });
    }

    // 查找用户（通过用户名或邮箱）
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码不正确' 
      });
    }

    // 检查密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码不正确' 
      });
    }

    // 检查用户状态
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: '该账户已被禁用' 
      });
    }

    // 生成token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 更新用户信息
exports.updateUser = async (req, res) => {
  try {
    const { avatar, bio } = req.body;
    const userId = req.user._id;

    // 只允许更新特定字段
    const updateData = {};
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;

    // 更新用户
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 更改密码
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // 验证请求
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供当前密码和新密码'
      });
    }

    // 获取用户
    const user = await User.findById(userId);

    // 验证当前密码
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '当前密码不正确'
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码已成功更新'
    });
  } catch (error) {
    console.error('更改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};
