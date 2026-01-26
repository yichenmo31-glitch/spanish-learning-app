const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const sessionRoutes = require('./routes/session');
const vocabularyRoutes = require('./routes/vocabulary');
const chatRoutes = require('./routes/chat');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api', chatRoutes);

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});