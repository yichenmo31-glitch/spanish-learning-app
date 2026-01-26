const pool = require('../db/config');

// 添加单词到笔记本
exports.addWord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { word, translation, example, exampleTranslation, pronunciation } = req.body;

    // 检查单词是否已存在
    const existingWord = await pool.query(
      'SELECT * FROM vocabulary WHERE user_id = $1 AND LOWER(word) = LOWER($2)',
      [userId, word]
    );

    if (existingWord.rows.length > 0) {
      return res.status(400).json({ message: 'Word already exists in notebook' });
    }

    // 添加单词
    await pool.query(
      `INSERT INTO vocabulary (user_id, word, translation, example, example_translation, pronunciation) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, word, translation, example, exampleTranslation, pronunciation]
    );

    res.status(201).json({ message: 'Word added to notebook' });
  } catch (error) {
    console.error('Error adding word:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取用户的单词笔记本
exports.getNotebook = async (req, res) => {
  try {
    const userId = req.user.id;

    const wordsResult = await pool.query(
      `SELECT * FROM vocabulary WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const words = wordsResult.rows.map(word => ({
      word: word.word,
      translation: word.translation,
      example: word.example,
      exampleTranslation: word.example_translation,
      pronunciation: word.pronunciation
    }));

    res.json({ notebook: words });
  } catch (error) {
    console.error('Error getting notebook:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 从笔记本中删除单词
exports.deleteWord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { word } = req.params;

    const result = await pool.query(
      'DELETE FROM vocabulary WHERE user_id = $1 AND LOWER(word) = LOWER($2)',
      [userId, word]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Word not found in notebook' });
    }

    res.json({ message: 'Word removed from notebook' });
  } catch (error) {
    console.error('Error deleting word:', error);
    res.status(500).json({ message: 'Server error' });
  }
};