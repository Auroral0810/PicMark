const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const authMiddleware = require('../middleware/auth');

// 获取上传凭证 GET /api/token
router.get('/', authMiddleware.optional, tokenController.getToken);

module.exports = router; 