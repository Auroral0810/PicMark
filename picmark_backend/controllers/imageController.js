const Image = require('../models/image.model');
const { deleteFile } = require('../utils/qiniu-sdk');
const { validationResult } = require('express-validator');
const Folder = require('../models/folder.model');

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
      format,
      ipAddress
    } = req.body;

    // 创建新图片记录
    const imageData = {
      title,
      description,
      url,
      key,
      tags: tags || [],
      width,
      height,
      fileSize,
      format,
      isPublic: true, // 默认公开
      ipAddress: ipAddress || req.ip || '未知' // 保存IP地址，如果前端未提供则使用请求中的IP
    };
    
    // 如果用户已登录，添加用户ID
    if (req.user) {
      imageData.user = req.user._id;
    } else {
      // 如果未登录，标记为匿名上传
      imageData.isAnonymous = true;
    }

    const image = await Image.create(imageData);

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
    
    // 检查用户是否登录及其角色
    if (req.user) {
      // 只有管理员可以查看所有图片，普通用户只能查看自己的和公开的图片
      if (req.user.role !== 'admin') {
        filter.$or = [
          { user: req.user._id },
          { isPublic: true }
        ];
      }
    } else {
      // 未登录用户只能查看公开图片
      filter.isPublic = true;
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

    // 如果图片不是公开的，需要检查权限
    if (!image.isPublic) {
      // 如果用户未登录，拒绝访问
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: '您需要登录才能访问此图片'
        });
      }
      
      // 如果用户不是管理员且不是图片所有者，拒绝访问
      if (req.user.role !== 'admin' && 
          image.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: '您无权访问此图片'
        });
      }
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
    console.log(`请求删除图片，ID: ${imageId}`);

    // 查找图片
    const image = await Image.findById(imageId);

    if (!image) {
      console.log(`图片不存在，ID: ${imageId}`);
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    // 记录图片关键信息，用于可能的恢复
    const imageKey = image.key;
    console.log(`准备删除图片: ${image.title}, 存储键: ${imageKey}`);

    // 检查权限
    // 允许以下情况删除：
    // 1. 图片是匿名上传的 (isAnonymous === true)
    // 2. 用户是图片所有者
    // 3. 用户是管理员
    if (!image.isAnonymous) {
      if (!req.user) {
        console.log(`未授权的删除请求: 图片ID ${imageId} 不是匿名上传且未提供认证`);
        return res.status(401).json({
          success: false,
          message: '未授权，请登录后再试'
        });
      }
      
      if (image.user && image.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        console.log(`权限不足: 用户 ${req.user._id} 尝试删除其他用户的图片 ${imageId}`);
        return res.status(403).json({
          success: false,
          message: '您无权删除此图片'
        });
      }
    }

    // 从七牛云删除文件 - 先执行这一步，因为如果失败，我们可以重试
    let qiniuDeleteSuccess = false;
    try {
      console.log(`开始从七牛云删除文件: ${imageKey}`);
      await deleteFile(imageKey);
      qiniuDeleteSuccess = true;
      console.log(`成功从七牛云删除文件: ${imageKey}`);
    } catch (qiniuError) {
      console.error(`从七牛云删除文件失败:`, qiniuError);
      // 这里不返回错误，继续尝试删除数据库中的记录
      if (qiniuError.respInfo) {
        console.error(`七牛云响应信息: 状态码=${qiniuError.respInfo.statusCode}`);
      }
    }

    // 从数据库删除图片记录
    try {
      await Image.findByIdAndDelete(imageId);
      console.log(`成功从数据库删除图片记录: ${imageId}`);
    } catch (dbError) {
      console.error(`从数据库删除图片记录失败:`, dbError);
      
      // 如果七牛云文件已删除但数据库删除失败，我们需要返回错误
      if (qiniuDeleteSuccess) {
        return res.status(500).json({
          success: false,
          message: '数据库操作失败，但云存储文件已删除',
          error: dbError.message
        });
      }
      
      throw dbError; // 重新抛出错误，由外层catch处理
    }

    // 如果七牛云删除失败但数据库删除成功，返回部分成功的信息
    if (!qiniuDeleteSuccess) {
      return res.status(207).json({
        success: true,
        partialSuccess: true,
        message: '图片记录已删除，但云存储删除失败，请联系管理员',
        key: imageKey
      });
    }

    // 全部成功
    return res.json({
      success: true,
      message: '图片已成功删除'
    });
  } catch (error) {
    console.error('删除图片失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
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

// 添加图片到文件夹
exports.addImageToFolder = async (req, res) => {
  try {
    const { folderId } = req.body;
    const imageId = req.params.id;

    // 确保图片存在
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    // 检查权限
    if (image.user && req.user && image.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限修改此图片'
      });
    }

    // 如果folderId为null，则从文件夹中移除图片
    if (!folderId) {
      image.folder = undefined;
      await image.save();
      return res.json({
        success: true,
        message: '图片已从文件夹中移除',
        data: image
      });
    }

    // 确保文件夹存在
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: '文件夹不存在'
      });
    }

    // 检查文件夹权限
    if (folder.user && req.user && folder.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限添加图片到此文件夹'
      });
    }

    // 更新图片的文件夹
    image.folder = folderId;
    await image.save();

    res.json({
      success: true,
      message: '图片已添加到文件夹',
      data: image
    });
  } catch (error) {
    console.error('添加图片到文件夹失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};
