const { getUploadToken, generateFileName } = require('../utils/qiniu-sdk');
const config = require('../config/qiniu');

// 获取上传凭证
exports.getToken = async (req, res) => {
  try {
    // 从请求中获取原始文件名
    const { filename } = req.query;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '请提供文件名'
      });
    }
    
    // 生成指定的文件名
    const fileInfo = await generateFileName(filename);
    
    // 获取上传凭证 - 使用完整存储路径作为key
    const token = getUploadToken(fileInfo.key);
    
    // 返回上传凭证和域名
    res.json({
      success: true,
      data: {
        token,
        key: fileInfo.key,
        filename: fileInfo.filename,
        domain: config.domain
      }
    });
  } catch (error) {
    console.error('获取上传凭证失败:', error);
    res.status(500).json({
      success: false,
      message: '获取上传凭证失败'
    });
  }
};
