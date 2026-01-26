const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

// 更新用户配置文件路由
router.put('/update', auth, profileController.updateProfile);

// 获取用户配置文件路由
router.get('/get', auth, profileController.getProfile);

module.exports = router;