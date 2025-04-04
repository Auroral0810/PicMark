const Image = require('../models/image.model');
const { deleteFile } = require('../utils/qiniu-sdk');
const { validationResult } = require('express-validator');

// 保存图片信息
exports.saveImage = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      url,
      key,
      tags,
      width,
      height,
      fileSize,
      format
    } = req.body;

    // 创建新图片记录
    const image = await Image.create({
      title,
      description,
      url,
      key,
      tags: tags || [],
      user: req.user._id,
      width,
      height,
      fileSize,
      format
    });

    res.status(201).json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error('保存图片失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取图片列表
exports.getImages = async (req, res) => {
  try {
    // 分页
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // 过滤条件
    const filter = {};
    
    // 只有管理员可以查看所有图片，普通用户只能查看自己的和公开的图片
    if (req.user.role !== 'admin') {
      filter.$or = [
        { user: req.user._id },
        { isPublic: true }
      ];
    }

    // 搜索条件
    const { keyword, tags, userId, dateFrom, dateTo } = req.query;
    
    if (keyword) {
      filter.$text = { $search: keyword };
    }
    
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $all: tagsArray };
    }
    
    if (userId) {
      filter.user = userId;
    }
    
    // 日期筛选
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    // 执行查询
    const images = await Image.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username avatar');

    // 获取总数
    const total = await Image.countDocuments(filter);

    res.json({
      success: true,
      data: {
        images,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取图片列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 搜索图片
exports.searchImages = async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      });
    }
    
    // 只有管理员可以查看所有图片，普通用户只能查看自己的和公开的图片
    const filter = {};
    if (req.user && req.user.role !== 'admin') {
      filter.$or = [
        { user: req.user._id },
        { isPublic: true }
      ];
    } else if (!req.user) {
      // 未登录用户只能查看公开图片
      filter.isPublic = true;
    }
    
    // 添加搜索条件
    filter.$text = { $search: keyword };
    
    // 执行搜索
    const images = await Image.find(filter)
      .sort({ score: { $meta: 'textScore' } })
      .limit(50)
      .populate('user', 'username avatar');
    
    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('搜索图片失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取单张图片
exports.getImage = async (req, res) => {
  try {
    const imageId = req.params.id;

    const image = await Image.findById(imageId)
      .populate('user', 'username avatar');

    if (!image) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    // 如果图片不是公开的，并且当前用户不是所有者或管理员，则拒绝访问
    if (!image.isPublic && 
        req.user.role !== 'admin' && 
        image.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '您无权访问此图片'
      });
    }

    // 增加浏览量
    image.views += 1;
    await image.save();

    res.json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error('获取图片失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 更新图片信息
exports.updateImage = async (req, res) => {
  try {
    const imageId = req.params.id;
    const { title, description, tags, isPublic } = req.body;

    // 查找图片
    const image = await Image.findById(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    // 只有图片所有者或管理员可以更新
    if (image.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '您无权更新此图片'
      });
    }

    // 更新图片信息（只允许更新某些字段）
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    // 保存更新
    const updatedImage = await Image.findByIdAndUpdate(
      imageId,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'username avatar');

    res.json({
      success: true,
      data: updatedImage
    });
  } catch (error) {
    console.error('更新图片失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 删除图片
exports.deleteImage = async (req, res) => {
  try {
    const imageId = req.params.id;

    // 查找图片
    const image = await Image.findById(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    // 只有图片所有者或管理员可以删除
    if (image.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '您无权删除此图片'
      });
    }

    // 先从数据库删除，防止七牛云删除操作的超时或错误影响整个操作
    await Image.findByIdAndDelete(imageId);

    // 从七牛云删除 - 使用Promise.race设置超时
    try {
      // 设置超时Promise
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('七牛云删除文件超时')), 5000)
      );
      
      // 使用Promise.race确保不会无限期等待
      await Promise.race([
        deleteFile(image.key),
        timeout
      ]);
      
      console.log(`成功从七牛云删除文件: ${image.key}`);
    } catch (qiniuError) {
      console.error('从七牛云删除文件失败:', qiniuError);
      // 已从数据库删除，所以继续返回成功响应
    }

    return res.json({
      success: true,
      message: '图片已成功删除'
    });
  } catch (error) {
    console.error('删除图片失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 用户给图片点赞/取消点赞
exports.toggleLike = async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.user._id;

    // 查找图片
    const image = await Image.findById(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    // 检查图片是否公开或用户是否为所有者
    if (!image.isPublic && 
        image.user.toString() !== userId.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '您无权操作此图片'
      });
    }

    // 检查用户是否已点赞
    const isLiked = image.likes.includes(userId);

    // 切换点赞状态
    if (isLiked) {
      // 取消点赞
      image.likes = image.likes.filter(
        id => id.toString() !== userId.toString()
      );
    } else {
      // 添加点赞
      image.likes.push(userId);
    }

    await image.save();

    res.json({
      success: true,
      liked: !isLiked,
      likesCount: image.likes.length
    });
  } catch (error) {
    console.error('切换点赞状态失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};
