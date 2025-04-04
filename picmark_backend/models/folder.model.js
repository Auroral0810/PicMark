const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// 创建索引以便搜索
folderSchema.index({ name: 'text', description: 'text' });

// 虚拟字段：图片数量
folderSchema.virtual('imageCount', {
  ref: 'Image',
  localField: '_id',
  foreignField: 'folder',
  count: true
});

// 确保虚拟字段在JSON中可见
folderSchema.set('toJSON', { virtuals: true });
folderSchema.set('toObject', { virtuals: true });

const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder; 