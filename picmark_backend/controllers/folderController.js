const Folder = require('../models/folder.model');
const Image = require('../models/image.model');
const { validationResult } = require('express-validator');

// 创建文件夹
exports.createFolder = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, description } = req.body;

    // 创建新文件夹
    const folderData = {
      name,
      description,
      isPublic: true // 默认公开
    };
    
    // 如果用户已登录，添加用户ID
    if (req.user) {
      folderData.user = req.user._id;
    }

    const folder = await Folder.create(folderData);

    res.status(201).json({
      success: true,
      data: folder
    });
  } catch (error) {
    console.error('创建文件夹失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取文件夹列表
exports.getFolders = async (req, res) => {
  try {
    // 构建查询条件
    const filter = {};
    
    // 检查用户是否登录及其角色
    if (req.user) {
      // 只有管理员可以查看所有文件夹，普通用户只能查看自己的和公开的文件夹
      if (req.user.role !== 'admin') {
        filter.$or = [
          { user: req.user._id },
          { isPublic: true }
        ];
      }
    } else {
      // 未登录用户只能查看公开文件夹
      filter.isPublic = true;
    }

    // 查询符合条件的文件夹
    const folders = await Folder.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: 'imageCount',
        match: { isPublic: true }
      });

    res.json({
      success: true,
      data: folders
    });
  } catch (error) {
    console.error('获取文件夹列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取单个文件夹
exports.getFolder = async (req, res) => {
  try {
    const folderId = req.params.id;

    const folder = await Folder.findById(folderId)
      .populate({
        path: 'imageCount',
        match: { isPublic: true }
      });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: '文件夹不存在'
      });
    }

    // 检查权限
    if (!folder.isPublic && (!req.user || (req.user.role !== 'admin' && folder.user.toString() !== req.user._id.toString()))) {
      return res.status(403).json({
        success: false,
        message: '没有权限访问此文件夹'
      });
    }

    res.json({
      success: true,
      data: folder
    });
  } catch (error) {
    console.error('获取文件夹失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 更新文件夹
exports.updateFolder = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const folderId = req.params.id;
    const { name, description, isPublic } = req.body;

    // 查找文件夹
    const folder = await Folder.findById(folderId);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: '文件夹不存在'
      });
    }

    // 检查权限
    if (folder.user && req.user && folder.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限更新此文件夹'
      });
    }

    // 更新文件夹
    folder.name = name || folder.name;
    folder.description = description !== undefined ? description : folder.description;
    folder.isPublic = isPublic !== undefined ? isPublic : folder.isPublic;

    await folder.save();

    res.json({
      success: true,
      data: folder
    });
  } catch (error) {
    console.error('更新文件夹失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 删除文件夹
exports.deleteFolder = async (req, res) => {
  try {
    const folderId = req.params.id;

    // 查找文件夹
    const folder = await Folder.findById(folderId);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: '文件夹不存在'
      });
    }

    // 检查权限
    if (folder.user && req.user && folder.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限删除此文件夹'
      });
    }

    // 解除所有关联图片的文件夹引用
    await Image.updateMany({ folder: folderId }, { $unset: { folder: "" } });

    // 删除文件夹
    await Folder.findByIdAndDelete(folderId);

    res.json({
      success: true,
      message: '文件夹已成功删除'
    });
  } catch (error) {
    console.error('删除文件夹失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取文件夹中的图片
exports.getFolderImages = async (req, res) => {
  try {
    const folderId = req.params.id;
    
    // 分页
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // 确保文件夹存在
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: '文件夹不存在'
      });
    }

    // 检查权限
    if (!folder.isPublic && (!req.user || (req.user.role !== 'admin' && folder.user.toString() !== req.user._id.toString()))) {
      return res.status(403).json({
        success: false,
        message: '没有权限访问此文件夹'
      });
    }

    // 构建查询条件
    const filter = { folder: folderId };
    
    // 非管理员且非文件夹创建者，只能查看公开图片
    if (!req.user || (req.user.role !== 'admin' && (!folder.user || folder.user.toString() !== req.user._id.toString()))) {
      filter.isPublic = true;
    }

    // 获取图片
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
    console.error('获取文件夹图片失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 将图片添加到文件夹
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