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
    bucketManager.getBucketInfo(bucket, (err, respBody, respInfo) => {
      if (err) {
        console.error('七牛云连接测试失败 - 错误:', err);
        
        // 分析错误类型，提供更友好的消息
        let errorMessage = err.message || '未知错误';
        
        // 处理常见的七牛云SDK错误
        if (errorMessage.includes('invalid access/secret key')) {
          errorMessage = 'AccessKey或SecretKey格式不正确';
        } else if (errorMessage.includes('authentication failed')) {
          errorMessage = '认证失败，AccessKey或SecretKey可能不正确';
        } else if (errorMessage.includes('bucket not found')) {
          errorMessage = '存储空间不存在，请确认存储空间名称正确且已创建';
        } else if (errorMessage.includes('connection') || errorMessage.includes('network')) {
          errorMessage = '网络连接问题，请检查您的网络设置或七牛云服务状态';
        }
        
        return res.json({
          success: false,
          message: `连接测试失败: ${errorMessage}`,
          error: {
            name: err.name,
            message: err.message
          }
        });
      }
      
      if (respInfo.statusCode !== 200) {
        console.error('七牛云连接测试失败 - 状态码:', respInfo.statusCode);
        
        // 为常见错误状态码提供更友好的解释
        let errorMessage = '';
        switch (respInfo.statusCode) {
          case 400:
            errorMessage = '请求参数不正确，请检查存储空间名称是否有效';
            break;
          case 401:
            errorMessage = '认证失败，AccessKey或SecretKey不正确，或没有权限访问此存储空间';
            break;
          case 403:
            errorMessage = '无权限操作，请检查您的账户权限设置';
            break;
          case 404:
            errorMessage = '存储空间不存在，请确认存储空间名称正确且已创建';
            break;
          case 612:
            errorMessage = '存储空间名称不正确或不存在';
            break;
          case 631:
            errorMessage = '存储空间管理功能被禁用';
            break;
          default:
            errorMessage = `未知错误: 状态码 ${respInfo.statusCode}, ${respInfo.statusMessage || ''}`;
        }
        
        return res.json({
          success: false,
          message: `连接测试失败: ${errorMessage}`,
          error: {
            code: respInfo.statusCode,
            details: respInfo.data || respInfo.statusMessage
          }
        });
      }
      
      // 验证区域是否匹配
      if (respBody.region !== region) {
        return res.json({
          success: false,
          message: `区域不匹配: 您配置的区域是 ${region}，但存储空间实际区域是 ${respBody.region}`
        });
      }
      
      // 验证域名
      // 注意：七牛云API无法直接验证域名，我们只能提供提示信息
      const domainTest = domain.trim().toLowerCase();
      if (!domainTest.startsWith('http://') && !domainTest.startsWith('https://')) {
        return res.json({
          success: false,
          message: '域名格式不正确，请确保包含http://或https://'
        });
      }
      
      // 尝试验证域名是否可访问（通过构建一个测试URL）
      const testUrl = `${domain}/test-picmark-access.txt`;
      
      console.log(`验证域名访问: ${testUrl}`);
      
      // 连接成功
      return res.json({
        success: true,
        message: '七牛云连接测试成功（注意：已验证密钥和区域，但无法完全验证域名，请确保域名有效且已绑定到此存储空间）',
        data: {
          region: respBody.region,
          bucketInfo: respBody,
          warnings: [
            '域名无法通过API自动验证，请手动确认域名格式正确且已在七牛云控制台绑定'
          ]
        }
      });
    });
  } catch (error) {
    console.error('测试七牛云连接失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误：' + error.message
    });
  }
}; 