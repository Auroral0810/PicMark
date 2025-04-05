const { getUploadToken, generateFileName } = require('../utils/qiniu-sdk');
const config = require('../config/qiniu');

// 获取上传凭证
exports.getToken = async (req, res) => {
  try {
    // 获取原始文件名和处理参数
    const { filename, convertFormat, addWatermark } = req.query;
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '缺少文件名参数'
      });
    }
    
    // 记录请求参数
    console.log('请求上传令牌:', {
      原始文件名: filename, 
      转换格式: convertFormat || '无', 
      添加水印: addWatermark === 'true' ? '是' : '否'
    });
    
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
    
    // 处理格式转换的文件名
    let finalFilename = filename;
    if (convertFormat) {
      // 移除原始扩展名
      const baseName = filename.replace(/\.[^/.]+$/, '');
      // 添加新扩展名
      switch (convertFormat) {
        case 'webp':
          finalFilename = `${baseName}.webp`;
          break;
        case 'jpeg':
          finalFilename = `${baseName}.jpg`;
          break;
        case 'png':
          finalFilename = `${baseName}.png`;
          break;
        default:
          console.log(`未知的转换格式 "${convertFormat}"，使用原始文件名`);
      }
      console.log(`文件格式转换: ${filename} -> ${finalFilename}`);
    }
    
    // 生成文件名
    const fileInfo = generateFileName(finalFilename, { 
      namingStrategy,
      addWatermark: addWatermark === 'true',
      convertFormat
    });
    
    console.log('生成的文件信息:', fileInfo);
    
    // 生成上传令牌
    const token = getUploadToken(fileInfo.key);
    
    // 记录相关处理标记到返回数据中
    const extraInfo = {
      convertFormat: convertFormat || null,
      addWatermark: addWatermark === 'true',
      originalFilename: filename,
      processedFilename: fileInfo.filename
    };
    
    console.log('生成的上传令牌:', {
      token: token ? '已生成(已省略显示)' : '生成失败',
      key: fileInfo.key,
      filename: fileInfo.filename,
      extraProcessing: extraInfo
    });
    
    res.json({
      success: true,
      data: {
        token,
        key: fileInfo.key,
        domain: config.domain,
        filename: fileInfo.filename,  // 返回生成的文件名
        processing: extraInfo  // 添加处理信息
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
