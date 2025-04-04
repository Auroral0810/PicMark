const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth');

// 创建文件夹
router.post(
  '/',
  [
    check('name', '文件夹名称必须').not().isEmpty(),
    check('name', '文件夹名称不能超过100个字符').isLength({ max: 100 }),
    check('description', '文件夹描述不能超过500个字符').optional().isLength({ max: 500 })
  ],
  authMiddleware.optional,
  folderController.createFolder
);

// 获取文件夹列表
router.get('/', authMiddleware.optional, folderController.getFolders);

// 获取单个文件夹
router.get('/:id', authMiddleware.optional, folderController.getFolder);

// 更新文件夹
router.put(
  '/:id',
  [
    check('name', '文件夹名称不能超过100个字符').optional().isLength({ max: 100 }),
    check('description', '文件夹描述不能超过500个字符').optional().isLength({ max: 500 }),
    check('isPublic', '公开状态必须是布尔值').optional().isBoolean()
  ],
  authMiddleware.optional,
  folderController.updateFolder
);

// 删除文件夹
router.delete('/:id', authMiddleware.optional, folderController.deleteFolder);

// 获取文件夹中的图片
router.get('/:id/images', authMiddleware.optional, folderController.getFolderImages);

module.exports = router; 