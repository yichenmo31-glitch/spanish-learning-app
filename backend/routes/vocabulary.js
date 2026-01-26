const express = require('express');
const router = express.Router();
const vocabularyController = require('../controllers/vocabularyController');
const auth = require('../middleware/auth');

// 添加单词到笔记本路由
router.post('/add', auth, vocabularyController.addWord);

// 获取用户的单词笔记本路由
router.get('/notebook', auth, vocabularyController.getNotebook);

// 从笔记本中删除单词路由
router.delete('/delete/:word', auth, vocabularyController.deleteWord);

module.exports = router;