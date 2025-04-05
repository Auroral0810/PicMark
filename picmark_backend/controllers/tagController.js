const { validationResult } = require('express-validator');
const Image = require('../models/image.model');

// 存储标签的内存数组，实际项目中应该使用数据库Tag模型
const tagsRegistry = new Set();

// 导出tagsRegistry以便其他模块使用
exports.tagsRegistry = tagsRegistry;

// 获取所有标签
exports.getTags = async (req, res) => {
  try {
    // 聚合查询获取所有图片中的标签
    const tagsFromImages = await Image.aggregate([
      { $unwind: "$tags" },
      { $group: { 
        _id: "$tags", 
        totalCount: { $sum: 1 },
        // 统计公开和非公开图片的数量
        publicCount: { 
          $sum: {
            $cond: [{ $eq: ["$isPublic", true] }, 1, 0]
          }
        },
        // 统计总访问量
        totalViews: {
          $sum: { $ifNull: ["$views", 0] }
        }
      }},
      { $sort: { totalCount: -1 } },  // 按照总图片数量排序
      { $project: { 
        _id: 0, 
        name: "$_id", 
        count: "$totalCount", 
        publicCount: "$publicCount",
        views: "$totalViews"
      }}
    ]);
    
    // 创建标签名称映射，用于快速检索
    const tagMap = {};
    tagsFromImages.forEach(tag => {
      tagMap[tag.name] = tag;
    });
    
    // 将内存中的标签库中的标签添加到结果中（如果它们不在图片中）
    const allTags = [...tagsFromImages];
    
    // 添加内存中的标签（如果不在图片中）
    tagsRegistry.forEach(tagName => {
      if (!tagMap[tagName]) {
        allTags.push({
          name: tagName,
          count: 0,
          publicCount: 0,
          views: 0
        });
      }
    });
    
    // 按照数量排序
    allTags.sort((a, b) => b.count - a.count);

    // 添加调试日志
    console.log(`API返回标签数量: ${allTags.length}`);
    allTags.forEach(tag => {
      console.log(`- ${tag.name}: 总数=${tag.count}, 公开=${tag.publicCount}, 访问量=${tag.views}`);
    });

    res.json({
      success: true,
      data: allTags
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

    // 将标签添加到内存中的标签库
    tagsRegistry.add(name);
    console.log(`已创建新标签: ${name}，未关联图片，count=0`);

    res.status(201).json({
      success: true,
      data: { name, count: 0 }
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
    
    // 检查旧标签是否存在于内存中
    if (tagsRegistry.has(oldName)) {
      tagsRegistry.delete(oldName);
      tagsRegistry.add(newName);
      console.log(`内存中的标签 "${oldName}" 已更新为 "${newName}"`);
    }

    // 查找所有包含此标签的图片并更新
    const updateResult = await Image.updateMany(
      { tags: oldName },
      { $set: { "tags.$[element]": newName } },
      { arrayFilters: [{ "element": oldName }] }
    );

    if (updateResult.matchedCount === 0 && !tagsRegistry.has(newName)) {
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
    
    // 从内存标签库中删除
    const existedInMemory = tagsRegistry.has(name);
    if (existedInMemory) {
      tagsRegistry.delete(name);
      console.log(`内存中的标签 "${name}" 已删除`);
    }

    // 从所有图片中移除此标签
    const updateResult = await Image.updateMany(
      { tags: name },
      { $pull: { tags: name } }
    );

    if (updateResult.matchedCount === 0 && !existedInMemory) {
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