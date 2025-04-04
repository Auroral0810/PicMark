const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  url: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  format: {
    type: String,
    required: true
  }
}, { timestamps: true });

// 创建索引以便搜索
imageSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Image = mongoose.model('Image', imageSchema);

module.exports = Image; 