/**
 * 模拟认证模块 - 用于无需登录的系统
 * 作为bcrypt的替代，所有方法都不执行实际操作
 */

// 模拟的bcrypt函数
const dummyBcrypt = {
  genSalt: async () => 'dummy-salt',
  
  hash: async (password) => {
    return `dummy-hash-${password}`;
  },
  
  compare: async (plain, hashed) => {
    // 总是返回true，表示密码匹配
    return true;
  }
};

// 模拟的JWT函数
const dummyJWT = {
  sign: (payload, secret, options) => {
    return 'dummy-jwt-token';
  },
  
  verify: (token, secret) => {
    // 返回一个模拟的解码payload
    return { id: 'dummy-user-id', role: 'user' };
  }
};

// 创建一个默认用户
const dummyUser = {
  _id: 'dummy-user-id',
  username: 'guest',
  email: 'guest@example.com',
  role: 'user',
  isActive: true
};

module.exports = {
  bcrypt: dummyBcrypt,
  jwt: dummyJWT,
  getUser: () => dummyUser
}; 