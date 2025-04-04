const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// JWT认证中间件
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // 检查Authorization头
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // 如果没有token
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: '未授权，请登录后再试' 
      });
    }
    
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查用户是否存在
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: '该用户不存在' 
      });
    }
    
    // 检查用户是否活跃
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: '该用户已被禁用' 
      });
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: '无效的认证令牌' 
    });
  }
};

// 授权中间件（用于管理员权限）
exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: '未授权，请登录后再试' 
      });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: '您没有权限执行此操作' 
      });
    }
    
    next();
  };
};
