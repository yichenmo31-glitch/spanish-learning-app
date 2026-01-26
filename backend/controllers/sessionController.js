const pool = require('../db/config');

// 创建新会话
exports.createSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { session_id, date, level, goal, coach, duration, overview, transcript, vocabulary, grammarPoints, feedback } = req.body;

    // 开始事务
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 创建会话
      const sessionResult = await client.query(
        `INSERT INTO sessions (user_id, session_id, date, level, goal, coach, duration, overview) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id`,
        [userId, session_id, date, level, goal, coach, duration, overview]
      );
      const newSessionId = sessionResult.rows[0].id;

      // 插入聊天消息
      for (const message of transcript) {
        await client.query(
          `INSERT INTO chat_messages (session_id, message_id, sender, text, translation, timestamp) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newSessionId, message.id, message.sender, message.text, message.translation, message.timestamp]
        );
      }

      // 插入词汇
      for (const word of vocabulary) {
        await client.query(
          `INSERT INTO session_vocabulary (session_id, word, translation, example, example_translation, pronunciation) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newSessionId, word.word, word.translation, word.example, word.exampleTranslation, word.pronunciation]
        );
      }

      // 插入语法点
      for (const point of grammarPoints) {
        await client.query(
          `INSERT INTO session_grammar_points (session_id, point) 
           VALUES ($1, $2)`,
          [newSessionId, point]
        );
      }

      // 插入反馈
      await client.query(
        `INSERT INTO session_feedback (session_id, strengths, improvements, note) 
         VALUES ($1, $2, $3, $4)`,
        [newSessionId, feedback.strengths, feedback.improvements, feedback.note]
      );

      await client.query('COMMIT');

      res.status(201).json({ message: 'Session created successfully', session_id });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取用户的会话历史
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户的所有会话
    const sessionsResult = await pool.query(
      `SELECT * FROM sessions WHERE user_id = $1 ORDER BY date DESC`,
      [userId]
    );

    const sessions = sessionsResult.rows;

    // 为每个会话获取完整信息
    const fullSessions = [];
    for (const session of sessions) {
      // 获取聊天消息
      const messagesResult = await pool.query(
        `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY timestamp`,
        [session.id]
      );

      // 获取词汇
      const vocabularyResult = await pool.query(
        `SELECT * FROM session_vocabulary WHERE session_id = $1`,
        [session.id]
      );

      // 获取语法点
      const grammarResult = await pool.query(
        `SELECT * FROM session_grammar_points WHERE session_id = $1`,
        [session.id]
      );

      // 获取反馈
      const feedbackResult = await pool.query(
        `SELECT * FROM session_feedback WHERE session_id = $1`,
        [session.id]
      );

      fullSessions.push({
        id: session.session_id,
        date: session.date,
        level: session.level,
        goal: session.goal,
        coach: session.coach,
        duration: session.duration,
        overview: session.overview,
        transcript: messagesResult.rows.map(msg => ({
          id: msg.message_id,
          sender: msg.sender,
          text: msg.text,
          translation: msg.translation,
          timestamp: msg.timestamp
        })),
        vocabulary: vocabularyResult.rows.map(word => ({
          word: word.word,
          translation: word.translation,
          example: word.example,
          exampleTranslation: word.example_translation,
          pronunciation: word.pronunciation
        })),
        grammarPoints: grammarResult.rows.map(point => point.point),
        feedback: feedbackResult.rows.length > 0 ? {
          strengths: feedbackResult.rows[0].strengths,
          improvements: feedbackResult.rows[0].improvements,
          note: feedbackResult.rows[0].note
        } : {
          strengths: [],
          improvements: [],
          note: ''
        }
      });
    }

    res.json({ history: fullSessions });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取单个会话详情
exports.getSessionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    // 获取会话
    const sessionResult = await pool.query(
      `SELECT * FROM sessions WHERE user_id = $1 AND session_id = $2`,
      [userId, sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // 获取聊天消息
    const messagesResult = await pool.query(
      `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY timestamp`,
      [session.id]
    );

    // 获取词汇
    const vocabularyResult = await pool.query(
      `SELECT * FROM session_vocabulary WHERE session_id = $1`,
      [session.id]
    );

    // 获取语法点
    const grammarResult = await pool.query(
      `SELECT * FROM session_grammar_points WHERE session_id = $1`,
      [session.id]
    );

    // 获取反馈
    const feedbackResult = await pool.query(
      `SELECT * FROM session_feedback WHERE session_id = $1`,
      [session.id]
    );

    const fullSession = {
      id: session.session_id,
      date: session.date,
      level: session.level,
      goal: session.goal,
      coach: session.coach,
      duration: session.duration,
      overview: session.overview,
      transcript: messagesResult.rows.map(msg => ({
        id: msg.message_id,
        sender: msg.sender,
        text: msg.text,
        translation: msg.translation,
        timestamp: msg.timestamp
      })),
      vocabulary: vocabularyResult.rows.map(word => ({
        word: word.word,
        translation: word.translation,
        example: word.example,
        exampleTranslation: word.example_translation,
        pronunciation: word.pronunciation
      })),
      grammarPoints: grammarResult.rows.map(point => point.point),
      feedback: feedbackResult.rows.length > 0 ? {
        strengths: feedbackResult.rows[0].strengths,
        improvements: feedbackResult.rows[0].improvements,
        note: feedbackResult.rows[0].note
      } : {
        strengths: [],
        improvements: [],
        note: ''
      }
    };

    res.json({ session: fullSession });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ message: 'Server error' });
  }
};