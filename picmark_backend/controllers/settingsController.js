const Settings = require('../models/settings');
const qiniu = require('qiniu');

// 获取设置
exports.getSettings = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!type || !['qiniu', 'system'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的设置类型'
      });
    }
    
    // 查找设置
    let settings = await Settings.findOne({ type });
    
    if (!settings) {
      // 如果设置不存在，返回空对象
      settings = { settings: {} };
    }
    
    return res.json({
      success: true,
      data: settings.settings
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 保存设置
exports.saveSettings = async (req, res) => {
  try {
    const { type } = req.params;
    const settingsData = req.body;
    
    if (!type || !['qiniu', 'system'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的设置类型'
      });
    }
    
    // 使用upsert选项，如果不存在则创建
    const settings = await Settings.findOneAndUpdate(
      { type },
      { 
        settings: settingsData,
        updatedAt: Date.now()
      },
      { 
        new: true,
        upsert: true
      }
    );
    
    return res.json({
      success: true,
      message: '设置已保存',
      data: settings.settings
    });
  } catch (error) {
    console.error('保存设置失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 测试七牛云连接
exports.testQiniuConnection = async (req, res) => {
  try {
    const { domain, bucket, accessKey, secretKey, region } = req.body;
    
    // 验证必要参数
    if (!domain || !bucket || !accessKey || !secretKey) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的参数'
      });
    }
    
    // 初始化七牛云认证
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    
    // 设置配置
    const config = new qiniu.conf.Config();
    
    // 设置区域
    switch(region) {
      case 'z0':
        config.zone = qiniu.zone.Zone_z0;
        break;
      case 'z1':
        config.zone = qiniu.zone.Zone_z1;
        break;
      case 'z2':
        config.zone = qiniu.zone.Zone_z2;
        break;
      case 'na0':
        config.zone = qiniu.zone.Zone_na0;
        break;
      case 'as0':
        config.zone = qiniu.zone.Zone_as0;
        break;
      default:
        config.zone = qiniu.zone.Zone_z2; // 默认华南区
    }
    
    // 创建存储空间管理器
    const bucketManager = new qiniu.rs.BucketManager(mac, config);
    
    // 尝试获取存储空间信息以测试连接
    return new Promise((resolve) => {
      bucketManager.getBucketInfo(bucket, (err, respBody, respInfo) => {
        if (err || (respInfo && respInfo.statusCode !== 200)) {
          return res.json({
            success: false,
            message: err ? err.message : '连接失败，请检查配置信息'
          });
        }
        
        // 连接成功
        return res.json({
          success: true,
          message: '七牛云连接测试成功',
          data: {
            region: respBody.region,
            bucketInfo: respBody
          }
        });
      });
    });
  } catch (error) {
    console.error('测试七牛云连接失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}; 