const Image = require('../models/image.model');
const { deleteFile } = require('../utils/qiniu-sdk');
const { validationResult } = require('express-validator');
const Folder = require('../models/folder.model');
const { networkInterfaces } = require('os');

/**
 * 获取真实IP地址的辅助函数
 * 如果是本地开发环境，尝试获取局域网IP
 */
function getRealIpAddress(req) {
  // 获取客户端原始IP
  const clientIP = req.headers['x-forwarded-for'] || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress || 
                 req.ip || 
                 '未知';
  
  // 如果是本地回环地址（localhost），则获取本机的局域网IP
  let finalIP = clientIP;
  if (clientIP === '::1' || clientIP === '127.0.0.1') {
    // 尝试获取本机局域网IP
    const nets = networkInterfaces();
    
    // 查找非内部的IPv4地址
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // 跳过内部和非IPv4地址
        if (net.family === 'IPv4' && !net.internal) {
          finalIP = net.address;
          break;
        }
      }
      if (finalIP !== clientIP) break; // 如果已找到外部IP，跳出循环
    }
    
    // 如果仍然没有找到，使用一个更有意义的本地IP
    if (finalIP === '::1' || finalIP === '127.0.0.1') {
      finalIP = '192.168.1.100'; // 使用一个典型的局域网IP
    }
  }
  
  console.log('原始客户端IP地址:', clientIP);
  console.log('最终使用的IP地址:', finalIP);
  
  return finalIP;
}

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

    // 输出完整请求体以帮助调试
    console.log('接收到上传图片请求，完整请求体:', JSON.stringify(req.body, null, 2));

    // 获取客户端真实IP地址
    const finalIP = getRealIpAddress(req);

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
      ipAddress, // 前端提供的IP（现在会忽略这个值）
      folderId // 获取文件夹ID
    } = req.body;

    // 获取系统设置
    const Settings = require('../models/settings');
    const systemSettings = await Settings.findOne({ type: 'system' });
    
    console.log('找到系统设置:', systemSettings ? '是' : '否');
    
    if (systemSettings && systemSettings.settings && systemSettings.settings.upload) {
      const uploadSettings = systemSettings.settings.upload;
      console.log('上传设置:', JSON.stringify(uploadSettings, null, 2));
      
      // 验证文件大小
      const maxSizeBytes = (uploadSettings.maxSize || 10) * 1024 * 1024; // 默认10MB
      console.log(`文件大小验证: ${fileSize} bytes (${fileSize/1024/1024}MB), 限制: ${maxSizeBytes} bytes (${uploadSettings.maxSize || 10}MB)`);
      
      if (fileSize > maxSizeBytes) {
        console.log('文件大小超出限制，拒绝上传');
        return res.status(400).json({
          success: false,
          message: `文件大小超出限制，最大允许${uploadSettings.maxSize || 10}MB`
        });
      }
      
      // 验证文件类型
      const fileMimeType = `image/${format.toLowerCase()}`;
      console.log(`文件类型验证: ${fileMimeType}`);
      
      if (uploadSettings.allowedTypesMIME && Array.isArray(uploadSettings.allowedTypesMIME)) {
        console.log('允许的MIME类型:', uploadSettings.allowedTypesMIME);
        
        // 检查allowedTypesMIME是否为空数组
        if (uploadSettings.allowedTypesMIME.length === 0) {
          console.log('允许的MIME类型为空数组，不验证文件类型');
        } else {
          // 执行严格验证
          if (!uploadSettings.allowedTypesMIME.includes(fileMimeType)) {
            console.log(`文件类型 ${fileMimeType} 不在允许列表中，拒绝上传`);
            return res.status(400).json({
              success: false,
              message: `不支持的文件类型: ${format}，仅支持: ${uploadSettings.allowedTypesMIME.map(t => t.split('/')[1]).join(', ')}`
            });
          }
          console.log(`文件类型验证通过: ${fileMimeType}`);
        }
      } else {
        console.log('没有设置允许的MIME类型列表或格式不正确，跳过文件类型验证');
      }
    } else {
      console.log('没有找到有效的上传设置，使用默认验证');
    }

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
      ipAddress: finalIP // 使用服务器获取的真实IP地址
    };
    
    console.log('处理文件夹ID:', folderId);
    
    // 如果提供了文件夹ID，则添加到图片数据中
    if (folderId) {
      // 验证文件夹是否存在
      const folderExists = await Folder.findById(folderId);
      if (folderExists) {
        imageData.folder = folderId;
        
        // 增加文件夹内图片计数
        await Folder.findByIdAndUpdate(folderId, { $inc: { imageCount: 1 } });
        console.log(`文件夹 ${folderId} 存在，已将图片添加到该文件夹`);
      } else {
        console.warn(`指定的文件夹ID ${folderId} 不存在`);
      }
    }
    
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
    const { keyword, tags, userId, dateFrom, dateTo, folder } = req.query;
    
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
    
    // 按文件夹过滤
    if (folder) {
      filter.folder = folder;
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
      .populate('user', 'username avatar')
      .populate('folder', 'name'); // 填充文件夹信息

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

    // 权限检查
    // 以下情况允许更新图片:
    // 1. 图片是匿名上传的 (isAnonymous === true)
    // 2. 用户是图片所有者
    // 3. 用户是管理员
    if (!image.isAnonymous) {
      // 如果不是匿名上传的图片，则需要用户登录
      if (!req.user) {
        console.log(`未授权的更新请求: 图片ID ${imageId} 不是匿名上传且未提供认证`);
        return res.status(401).json({
          success: false,
          message: '未授权，请登录后再试'
        });
      }
      
      // 检查登录用户是否有权限更新此图片
      if (image.user && image.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '您无权更新此图片'
        });
      }
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
    );
    
    // 如果图片有关联用户，则填充用户信息
    if (updatedImage.user) {
      await updatedImage.populate('user', 'username avatar');
    }

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

/**
 * 记录图片被访问
 * @route POST /api/images/:id/view
 * @access Public
 */
exports.recordImageView = async (req, res) => {
  try {
    const imageId = req.params.id;
    
    // 获取客户端真实IP
    const finalIP = getRealIpAddress(req);
    
    // 获取当前时间
    const viewTime = new Date();
    
    // 查找图片
    const image = await Image.findById(imageId);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }
    
    // 增加浏览量
    image.views = (image.views || 0) + 1;
    
    // 记录访问日志（如果图片模型有此字段）
    if (Array.isArray(image.viewLogs)) {
      image.viewLogs.push({ ip: finalIP, time: viewTime });
      
      // 限制日志数量，只保留最近的100条
      if (image.viewLogs.length > 100) {
        image.viewLogs = image.viewLogs.slice(-100);
      }
    }
    
    // 保存修改
    await image.save();
    
    console.log(`图片 ${imageId} 被 ${finalIP} 在 ${viewTime.toISOString()} 访问，累计访问量: ${image.views}`);
    
    res.status(200).json({
      success: true,
      message: '访问已记录',
      views: image.views
    });
  } catch (error) {
    console.error('记录图片访问失败:', error);
    res.status(500).json({
      success: false,
      message: '无法记录图片访问'
    });
  }
};

/**
 * 获取所有图片
 * @route GET /api/images/all
 * @access Public
 */
exports.getAllImages = async (req, res) => {
  try {
    // 查询所有公开图片，不分页
    const images = await Image.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar');
    
    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('获取所有图片失败:', error);
    res.status(500).json({
      success: false, 
      message: '服务器错误'
    });
  }
};

/**
 * 获取图片的标签
 * @route GET /api/images/:id/tags
 * @access Public
 */
exports.getImageTags = async (req, res) => {
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
    
    res.status(200).json({
      success: true,
      data: image.tags || []
    });
  } catch (error) {
    console.error('获取图片标签失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

/**
 * 给图片添加标签
 * @route POST /api/images/:id/tags
 * @access Private
 */
exports.addTagToImage = async (req, res) => {
  try {
    const imageId = req.params.id;
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的标签数组'
      });
    }
    
    // 查找图片
    const image = await Image.findById(imageId);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }
    
    // 添加新标签并去重
    const currentTags = image.tags || [];
    const uniqueTags = [...new Set([...currentTags, ...tags])];
    
    // 更新图片的标签
    image.tags = uniqueTags;
    await image.save();
    
    res.status(200).json({
      success: true,
      message: '标签已添加',
      data: image.tags
    });
  } catch (error) {
    console.error('添加图片标签失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

/**
 * 从图片移除标签
 * @route DELETE /api/images/:id/tags/:tagName
 * @access Private
 */
exports.removeTagFromImage = async (req, res) => {
  try {
    const imageId = req.params.id;
    const tagName = req.params.tagName;
    
    // 查找图片
    const image = await Image.findById(imageId);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }
    
    // 移除标签
    if (image.tags && image.tags.includes(tagName)) {
      image.tags = image.tags.filter(tag => tag !== tagName);
      await image.save();
    }
    
    res.status(200).json({
      success: true,
      message: '标签已移除',
      data: image.tags
    });
  } catch (error) {
    console.error('移除图片标签失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

/**
 * 获取图片的EXIF数据
 * @route GET /api/images/:id/exif
 * @access Private
 */
exports.getImageExif = async (req, res) => {
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
    
    // 在实际应用中，这里应该返回从图片中提取的EXIF数据
    // 这里我们返回一些模拟数据
    const exifData = {
      make: 'Example Camera',
      model: 'Model X',
      exposureTime: '1/100',
      fNumber: 'f/2.8',
      iso: 200,
      dateTaken: new Date().toISOString(),
      dimensions: `${image.width}x${image.height}`,
      fileSize: image.fileSize,
      format: image.format
    };
    
    res.status(200).json({
      success: true,
      data: exifData
    });
  } catch (error) {
    console.error('获取图片EXIF数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};
