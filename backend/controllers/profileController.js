const pool = require('../db/config');

// 更新用户配置文件
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { level, goal, coach } = req.body;

    // 检查用户配置文件是否存在
    const existingProfile = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);

    if (existingProfile.rows.length > 0) {
      // 更新现有配置文件
      await pool.query(
        'UPDATE user_profiles SET level = $1, goal = $2, coach = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4',
        [level, goal, coach, userId]
      );
    } else {
      // 创建新配置文件
      await pool.query(
        'INSERT INTO user_profiles (user_id, level, goal, coach) VALUES ($1, $2, $3, $4)',
        [userId, level, goal, coach]
      );
    }

    res.json({
      profile: {
        level,
        goal,
        coach
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取用户配置文件
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profileResult = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profile = profileResult.rows[0];

    res.json({
      profile: {
        level: profile.level,
        goal: profile.goal,
        coach: profile.coach
      }
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};