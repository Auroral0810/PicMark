const qiniu = require('qiniu');
const config = require('../config/qiniu');
const { v4: uuidv4 } = require('uuid');

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

// 生成文件名
const generateFileName = (originalFilename) => {
  const date = new Date();
  const datePrefix = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  const uuid = uuidv4();
  
  // 提取文件扩展名
  const ext = originalFilename.split('.').pop();
  return `${datePrefix}/${uuid}.${ext}`;
};

// 删除文件
const deleteFile = async (key) => {
  const qiniuConfig = new qiniu.conf.Config();
  // 根据存储区域选择机房
  // 设置区域，确保使用正确的区域引用
  switch(config.region) {
    case 'z0':
      qiniuConfig.zone = qiniu.zone.Zone_z0;
      break;
    case 'z1':
      qiniuConfig.zone = qiniu.zone.Zone_z1;
      break;
    case 'z2':
      qiniuConfig.zone = qiniu.zone.Zone_z2;
      break;
    case 'na0':
      qiniuConfig.zone = qiniu.zone.Zone_na0;
      break;
    case 'as0':
      qiniuConfig.zone = qiniu.zone.Zone_as0;
      break;
    default:
      qiniuConfig.zone = qiniu.zone.Zone_z2; // 默认华南区
  }
  
  const bucketManager = new qiniu.rs.BucketManager(mac, qiniuConfig);
  return new Promise((resolve, reject) => {
    bucketManager.delete(config.bucket, key, (err, respBody, respInfo) => {
      if (err) {
        reject(err);
      } else {
        resolve(respInfo);
      }
    });
  });
};

module.exports = {
  getUploadToken,
  generateFileName,
  deleteFile
};
