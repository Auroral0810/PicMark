const express = require('express');
const { check } = require('express-validator');
const tagController = require('../controllers/tagController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 获取标签列表 GET /api/tags
router.get('/', tagController.getTags);

// 创建标签 POST /api/tags
router.post(
  '/',
  [
    check('name', '标签名称不能为空').not().isEmpty(),
    check('name', '标签名称不能超过50个字符').isLength({ max: 50 })
  ],
  authMiddleware.optional,
  tagController.createTag
);

// 更新标签 PUT /api/tags/:oldName
router.put(
  '/:oldName',
  [
    check('newName', '新标签名称不能为空').not().isEmpty(),
    check('newName', '新标签名称不能超过50个字符').isLength({ max: 50 })
  ],
  authMiddleware.optional,
  tagController.updateTag
);

// 删除标签 DELETE /api/tags/:name
router.delete('/:name', authMiddleware.optional, tagController.deleteTag);

module.exports = router; 