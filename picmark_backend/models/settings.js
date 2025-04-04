const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // 设置类型，qiniu 或 system
  type: {
    type: String,
    required: true,
    enum: ['qiniu', 'system']
  },
  // 设置项
  settings: {
    type: Object,
    required: true
  },
  // 最后更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 确保每种类型的设置只有一条记录
settingsSchema.index({ type: 1 }, { unique: true });

module.exports = mongoose.model('Settings', settingsSchema); 