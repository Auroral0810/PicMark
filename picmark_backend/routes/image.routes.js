const express = require('express');
const { check } = require('express-validator');
const imageController = require('../controllers/imageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 以下路由需要认证
router.use(protect);

// 获取图片列表 GET /api/images
router.get('/', imageController.getImages);

// 保存图片信息 POST /api/images
router.post(
  '/',
  [
    check('title', '标题是必需的').not().isEmpty(),
    check('url', 'URL是必需的').not().isEmpty(),
    check('key', '存储键是必需的').not().isEmpty(),
    check('width', '宽度是必需的').isNumeric(),
    check('height', '高度是必需的').isNumeric(),
    check('fileSize', '文件大小是必需的').isNumeric(),
    check('format', '格式是必需的').not().isEmpty()
  ],
  imageController.saveImage
);

// 获取单张图片 GET /api/images/:id
router.get('/:id', imageController.getImage);

// 更新图片信息 PUT /api/images/:id
router.put('/:id', imageController.updateImage);

// 删除图片 DELETE /api/images/:id
router.delete('/:id', imageController.deleteImage);

// 点赞/取消点赞 POST /api/images/:id/like
router.post('/:id/like', imageController.toggleLike);

module.exports = router; 