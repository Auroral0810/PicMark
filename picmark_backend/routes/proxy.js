const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * 图片代理服务
 * 用于从外部URL获取图片并返回给前端，避免跨域问题
 */
router.get('/', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: '请提供URL参数'
      });
    }
    
    console.log(`代理请求: ${url}`);
    
    // 验证URL格式
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: '无效的URL格式'
      });
    }
    
    // 从外部URL获取内容
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer',
      headers: {
        // 设置用户代理以避免某些网站的访问限制
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // 设置超时，避免长时间等待
      timeout: 10000
    });
    
    // 获取内容类型
    const contentType = response.headers['content-type'];
    
    // 验证是否为图片类型
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: '获取的不是图片文件'
      });
    }
    
    // 设置响应头
    res.set('Content-Type', contentType);
    res.set('Access-Control-Allow-Origin', '*');
    
    // 返回图片内容
    res.send(response.data);
    
    console.log(`代理请求成功: ${url}, 内容类型: ${contentType}, 大小: ${response.data.length} 字节`);
  } catch (error) {
    console.error('代理请求失败:', error.message);
    
    res.status(500).json({
      success: false,
      message: `获取远程内容失败: ${error.message}`,
      error: error.toString()
    });
  }
});

module.exports = router; 