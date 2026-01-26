const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// 处理聊天请求路由
router.post('/chat', auth, chatController.handleChat);

module.exports = router;
