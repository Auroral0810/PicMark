const { getUploadToken, generateFileName } = require('../utils/qiniu-sdk');
const config = require('../config/qiniu');

// 获取上传凭证
exports.getToken = async (req, res) => {
  try {
    // 获取原始文件名
    const { filename } = req.query;
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '缺少文件名参数'
      });
    }
    
    console.log('请求上传令牌，原始文件名:', filename);
    
    // 获取系统设置以确定命名策略
    const Settings = require('../models/settings');
    const systemSettings = await Settings.findOne({ type: 'system' });
    
    let namingStrategy = 'timestamp'; // 默认使用时间戳命名
    
    if (systemSettings && systemSettings.settings && systemSettings.settings.upload) {
      namingStrategy = systemSettings.settings.upload.renameType || 'timestamp';
      console.log(`从系统设置中获取命名策略: ${namingStrategy}`);
    } else {
      console.log('未找到系统设置或上传配置，使用默认命名策略:', namingStrategy);
    }
    
    // 生成文件名（新版本是同步函数，不再使用await）
    const fileInfo = generateFileName(filename, { namingStrategy });
    
    console.log('生成的文件信息:', fileInfo);
    
    // 生成上传令牌
    const token = getUploadToken(fileInfo.key);
    
    console.log('生成的上传令牌:', {
      token: token ? '已生成(已省略显示)' : '生成失败',
      key: fileInfo.key,
      filename: fileInfo.filename
    });
    
    res.json({
      success: true,
      data: {
        token,
        key: fileInfo.key,
        domain: config.domain,
        filename: fileInfo.filename  // 返回生成的文件名
      }
    });
  } catch (error) {
    console.error('生成令牌失败:', error);
    res.status(500).json({
      success: false,
      message: '生成上传令牌失败: ' + error.message
    });
  }
};
