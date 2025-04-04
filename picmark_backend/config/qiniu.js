const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  accessKey: process.env.QINIU_ACCESS_KEY,
  secretKey: process.env.QINIU_SECRET_KEY,
  bucket: process.env.QINIU_BUCKET,
  domain: process.env.QINIU_DOMAIN,
  region: process.env.QINIU_REGION || 'z2', // 华南-广东
  expires: 3600,  // 上传凭证有效期(秒)
  returnBody: `{
    "key": "$(key)",
    "hash": "$(etag)",
    "fname": "$(fname)",
    "size": $(fsize),
    "mimeType": "$(mimeType)",
    "width": $(imageInfo.width),
    "height": $(imageInfo.height)
  }`
};
