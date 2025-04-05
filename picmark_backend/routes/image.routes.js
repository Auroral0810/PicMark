const express = require('express');
const { check } = require('express-validator');
const imageController = require('../controllers/imageController');
const folderController = require('../controllers/folderController');
const { protect } = require('../middleware/auth');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 公开路由 - 不需要认证

// 获取所有图片 GET /api/images/all
router.get('/all', imageController.getAllImages);

// 获取图片列表 GET /api/images
router.get('/', imageController.getImages);

// 获取单张图片 GET /api/images/:id
router.get('/:id', imageController.getImage);

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

// 删除图片 DELETE /api/images/:id - 公开访问
// 在控制器中会检查权限（匿名上传的图片可以直接删除，其他图片需要权限）
router.delete('/:id', imageController.deleteImage);

// 添加图片到文件夹 - 公开访问
router.put('/:id/folder', imageController.addImageToFolder);

// 记录图片被访问 - 公开访问
router.post('/:id/view', imageController.recordImageView);

// 获取图片的标签 - 公开访问
router.get('/:id/tags', imageController.getImageTags);

// 更新图片信息 PUT /api/images/:id - 公开访问
// 控制器中会检查权限（匿名上传的图片可以直接更新，其他图片需要权限）
router.put('/:id', imageController.updateImage);

// 以下路由需要认证
router.use(protect);

// 点赞/取消点赞 POST /api/images/:id/like
router.post('/:id/like', imageController.toggleLike);

// 给图片添加标签 - 需要认证
router.post('/:id/tags', imageController.addTagToImage);

// 从图片移除标签 - 需要认证
router.delete('/:id/tags/:tagName', imageController.removeTagFromImage);

// 获取图片的EXIF数据 - 需要认证
router.get('/:id/exif', imageController.getImageExif);

module.exports = router; 