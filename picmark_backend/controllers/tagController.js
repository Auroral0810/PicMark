const { validationResult } = require('express-validator');
const Image = require('../models/image.model');

// 获取所有标签
exports.getTags = async (req, res) => {
  try {
    // 聚合查询获取所有图片中使用的标签及其数量
    const tags = await Image.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, name: "$_id", count: 1 } }
    ]);

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 创建标签 (添加到系统中)
exports.createTag = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name } = req.body;

    // 检查标签是否存在
    const existingTagCount = await Image.aggregate([
      { $unwind: "$tags" },
      { $match: { tags: name } },
      { $count: "count" }
    ]);

    if (existingTagCount.length > 0 && existingTagCount[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '标签已存在'
      });
    }

    // 创建一个空图片添加此标签作为示例
    // 注意：在实际系统中，您可能需要一个单独的Tag模型
    // 这里为了简化，我们创建一个"示例"图片来保存新标签
    const sampleImage = new Image({
      title: `Tag Sample - ${name}`,
      description: `Sample image for tag: ${name}`,
      url: 'https://example.com/sample.jpg',
      key: `tag_sample_${Date.now()}`,
      tags: [name],
      width: 100,
      height: 100,
      fileSize: 1024,
      format: 'jpg',
      isPublic: false
    });

    await sampleImage.save();

    res.status(201).json({
      success: true,
      data: { name, count: 1 }
    });
  } catch (error) {
    console.error('创建标签失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 更新标签名称
exports.updateTag = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { oldName } = req.params;
    const { newName } = req.body;

    if (!oldName || !newName) {
      return res.status(400).json({
        success: false,
        message: '需要同时提供旧标签名和新标签名'
      });
    }

    // 查找所有包含此标签的图片并更新
    const updateResult = await Image.updateMany(
      { tags: oldName },
      { $set: { "tags.$[element]": newName } },
      { arrayFilters: [{ "element": oldName }] }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: '标签不存在或没有图片使用此标签'
      });
    }

    res.json({
      success: true,
      message: `标签已从 "${oldName}" 更新为 "${newName}"`,
      data: {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('更新标签失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 删除标签
exports.deleteTag = async (req, res) => {
  try {
    const { name } = req.params;

    // 从所有图片中移除此标签
    const updateResult = await Image.updateMany(
      { tags: name },
      { $pull: { tags: name } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: '标签不存在或没有图片使用此标签'
      });
    }

    res.json({
      success: true,
      message: `标签 "${name}" 已从所有图片中删除`,
      data: {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('删除标签失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}; 