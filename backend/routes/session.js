const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const auth = require('../middleware/auth');

// 创建新会话路由
router.post('/create', auth, sessionController.createSession);

// 获取用户的会话历史路由
router.get('/history', auth, sessionController.getHistory);

// 获取单个会话详情路由
router.get('/:sessionId', auth, sessionController.getSessionById);

module.exports = router;