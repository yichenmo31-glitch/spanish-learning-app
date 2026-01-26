const pool = require('../db/config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 注册用户
exports.register = async (req, res) => {
  try {
    const { email, password, level, goal, coach } = req.body;

    // 检查邮箱是否已存在
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 开始事务
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 创建用户
      const userResult = await client.query(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
        [email, hashedPassword]
      );
      const userId = userResult.rows[0].id;

      // 创建用户配置文件
      await client.query(
        'INSERT INTO user_profiles (user_id, level, goal, coach) VALUES ($1, $2, $3, $4)',
        [userId, level, goal, coach]
      );

      await client.query('COMMIT');

      // 生成JWT令牌
      const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
      });

      res.status(201).json({
        token,
        user: {
          id: userId,
          email,
          profile: {
            level,
            goal,
            coach
          }
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 检查用户是否存在
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 获取用户配置文件
    const profileResult = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [user.id]);
    const profile = profileResult.rows[0];

    // 生成JWT令牌
    const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        profile: profile ? {
          level: profile.level,
          goal: profile.goal,
          coach: profile.coach
        } : null
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户信息
    const userResult = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // 获取用户配置文件
    const profileResult = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    const profile = profileResult.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        profile: profile ? {
          level: profile.level,
          goal: profile.goal,
          coach: profile.coach
        } : null
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};