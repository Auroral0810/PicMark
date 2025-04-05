const qiniu = require('qiniu');
const config = require('../config/qiniu');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// 初始化鉴权对象
const mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey);

// 获取上传凭证
const getUploadToken = (key = null) => {
  const options = {
    scope: key ? `${config.bucket}:${key}` : config.bucket,
    expires: config.expires,
    returnBody: config.returnBody,
    // 可以根据需要设置其他上传策略，如fileType限制、fsizeLimit等
  };
  
  const putPolicy = new qiniu.rs.PutPolicy(options);
  return putPolicy.uploadToken(mac);
};

/**
 * 生成文件名
 * 实现多种命名策略：原始名、时间戳、UUID等
 * 并按日期自动分文件夹
 */
const generateFileName = (originalName, opts = {}) => {
  // 获取当前日期，格式为YYYYMMDD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateFolder = `${year}${month}${day}`;
  
  // 记录调用日志
  console.log('generateFileName函数被调用:', {
    原始文件名: originalName,
    参数: JSON.stringify(opts),
    日期目录: dateFolder
  });
  
  // 处理格式转换 - 确保文件扩展名与转换格式匹配
  const { convertFormat } = opts;
  let processedName = originalName;
  
  if (convertFormat) {
    console.log(`执行格式转换: ${convertFormat}`);
    // 移除原始扩展名
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    // 添加新扩展名
    switch (convertFormat) {
      case 'webp':
        processedName = `${baseName}.webp`;
        break;
      case 'jpeg':
        processedName = `${baseName}.jpg`;
        break;
      case 'png':
        processedName = `${baseName}.png`;
        break;
      default:
        console.log(`未知的转换格式 "${convertFormat}"，使用原始文件名`);
    }
    console.log(`文件格式已转换: ${originalName} -> ${processedName}`);
  }
  
  // 获取文件扩展名（保持原始大小写）
  const extWithDot = processedName.match(/\.[^.]+$/);
  const ext = extWithDot ? extWithDot[0].toLowerCase().substring(1) : '';
  
  // 按策略生成新文件名
  let newFileName = '';
  const namingStrategy = opts.namingStrategy || 'original';
  
  // 添加更多详细的日志
  console.log(`应用文件命名策略: ${namingStrategy}`);
  
  switch (namingStrategy) {
    case 'original':
      // 使用原始文件名，但添加时间戳前缀以避免冲突
      const timestamp = now.getTime();
      newFileName = `${timestamp}_${processedName}`;
      console.log(`使用原始文件名策略: ${newFileName}`);
      break;
      
    case 'timestamp':
      // 使用时间戳命名
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      
      // 保留原始文件扩展名
      newFileName = `${year}${month}${day}_${hours}${mins}${secs}_${ms}${extWithDot ? extWithDot[0] : ''}`;
      console.log(`使用时间戳策略: ${newFileName}`);
      break;
      
    case 'uuid':
      // 使用UUID命名
      const uuid = crypto.randomUUID ? crypto.randomUUID() : 
                   (Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15));
      
      // 保留原始文件扩展名
      newFileName = `${uuid}${extWithDot ? extWithDot[0] : ''}`;
      console.log(`使用UUID策略: ${newFileName}`);
      break;
      
    default:
      // 默认使用原始文件名
      newFileName = processedName;
      console.log(`使用默认命名策略: ${newFileName}`);
  }
  
  // 创建完整的存储路径 (key) 和显示文件名
  const storageKey = `${dateFolder}/${newFileName}`;
  
  // 返回包含存储路径和显示文件名的对象
  const result = {
    key: storageKey,
    filename: newFileName
  };
  
  console.log('生成的文件信息:', result);
  
  return result;
};

// 删除文件
const deleteFile = async (key) => {
  console.log(`准备删除七牛云文件，文件key: ${key}`);
  console.log(`七牛云配置: bucket=${config.bucket}, region=${config.region}`);

  if (!key) {
    console.error('无效的文件key');
    return Promise.reject(new Error('无效的文件key'));
  }

  const qiniuConfig = new qiniu.conf.Config();
  // 根据存储区域选择机房
  let zoneLabel = '未知区域';
  
  // 设置区域，确保使用正确的区域引用
  switch(config.region) {
    case 'z0':
      qiniuConfig.zone = qiniu.zone.Zone_z0;
      zoneLabel = '华东区域(z0)';
      break;
    case 'z1':
      qiniuConfig.zone = qiniu.zone.Zone_z1;
      zoneLabel = '华北区域(z1)';
      break;
    case 'z2':
      qiniuConfig.zone = qiniu.zone.Zone_z2;
      zoneLabel = '华南区域(z2)';
      break;
    case 'na0':
      qiniuConfig.zone = qiniu.zone.Zone_na0;
      zoneLabel = '北美区域(na0)';
      break;
    case 'as0':
      qiniuConfig.zone = qiniu.zone.Zone_as0;
      zoneLabel = '亚太区域(as0)';
      break;
    default:
      // 默认设置为华东区域
      console.log(`未指定区域或区域不存在，使用华东区域(z0)`);
      qiniuConfig.zone = qiniu.zone.Zone_z0;
      zoneLabel = '华东区域(z0)默认值';
  }

  console.log(`使用七牛云存储区域: ${zoneLabel}`);
  
  // 检查七牛云认证配置
  if (!config.accessKey || !config.secretKey) {
    console.error('七牛云配置缺失: accessKey或secretKey未设置');
    return Promise.reject(new Error('七牛云配置缺失'));
  }

  // 创建存储空间管理器
  const bucketManager = new qiniu.rs.BucketManager(mac, qiniuConfig);
  
  // 检查存储空间配置
  if (!config.bucket) {
    console.error('七牛云存储空间(bucket)未设置');
    return Promise.reject(new Error('七牛云存储空间未设置'));
  }
  
  console.log(`开始从七牛云删除文件: ${key}`);
  
  return new Promise((resolve, reject) => {
    bucketManager.delete(config.bucket, key, (err, respBody, respInfo) => {
      if (err) {
        console.error(`七牛云删除文件失败(SDK错误): ${err.message}`);
        reject(err);
      } else {
        // 七牛云API可能返回成功但包含错误码的情况
        if (respInfo.statusCode === 200) {
          console.log(`七牛云删除文件成功: ${key}`);
          resolve(respInfo);
        } else if (respInfo.statusCode === 400 && respBody?.error_code === 'IncorrectZone') {
          console.error(`区域错误: 当前配置区域(${config.region})与文件实际存储区域不符，尝试其他区域...`);
          
          // 如果是区域错误，可以尝试所有可能的区域
          tryAllZones(key, config.bucket)
            .then(resolve)
            .catch(reject);
        } else {
          console.error(`七牛云删除文件失败: 状态码=${respInfo.statusCode}, 响应体=${JSON.stringify(respBody)}`);
          // 将七牛云返回的错误信息转化为Error对象
          const error = new Error(`七牛云删除失败: ${respInfo.statusCode} ${respBody?.error || ''}`);
          error.respInfo = respInfo;
          error.respBody = respBody;
          reject(error);
        }
      }
    });
  });
};

// 尝试所有可能的区域删除文件
const tryAllZones = async (key, bucket) => {
  console.log(`尝试在所有可能的区域删除文件: ${key}`);
  
  // 所有可能的区域配置
  const zones = [
    { code: 'z0', zone: qiniu.zone.Zone_z0, label: '华东区域' },
    { code: 'z1', zone: qiniu.zone.Zone_z1, label: '华北区域' },
    { code: 'z2', zone: qiniu.zone.Zone_z2, label: '华南区域' },
    { code: 'na0', zone: qiniu.zone.Zone_na0, label: '北美区域' },
    { code: 'as0', zone: qiniu.zone.Zone_as0, label: '亚太区域' }
  ];
  
  // 排除当前已尝试的区域
  const filteredZones = zones.filter(z => z.code !== config.region);
  
  // 尝试每个区域
  for (const zoneInfo of filteredZones) {
    const qiniuConfig = new qiniu.conf.Config();
    qiniuConfig.zone = zoneInfo.zone;
    
    console.log(`尝试使用 ${zoneInfo.label}(${zoneInfo.code}) 删除文件...`);
    
    const bucketManager = new qiniu.rs.BucketManager(mac, qiniuConfig);
    
    try {
      const result = await new Promise((resolve, reject) => {
        bucketManager.delete(bucket, key, (err, respBody, respInfo) => {
          if (err) {
            reject(err);
          } else if (respInfo.statusCode === 200) {
            resolve(respInfo);
          } else {
            const error = new Error(`七牛云删除失败: ${respInfo.statusCode}`);
            error.respInfo = respInfo;
            error.respBody = respBody;
            reject(error);
          }
        });
      });
      
      console.log(`成功在 ${zoneInfo.label}(${zoneInfo.code}) 区域删除文件`);
      console.log(`请更新.env文件中的QINIU_REGION配置为${zoneInfo.code}以避免将来的区域错误`);
      return result;
    } catch (error) {
      console.log(`在 ${zoneInfo.label}(${zoneInfo.code}) 区域删除文件失败:`, error.message);
      // 继续尝试下一个区域
    }
  }
  
  // 如果所有区域都失败，抛出错误
  throw new Error('在所有区域尝试删除文件都失败');
};

module.exports = {
  getUploadToken,
  generateFileName,
  deleteFile
};
