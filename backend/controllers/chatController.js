const pool = require('../db/config');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 初始化Google GenAI
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error('Google API key is not set');
  process.exit(1);
}

const ai = new GoogleGenerativeAI(apiKey);

// 处理聊天请求
exports.handleChat = async (req, res) => {
  try {
    const { message, context, coachType, level, goal } = req.body;

    // 验证请求参数
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // 准备系统指令
    const systemInstruction = coachType === 'alma'
      ? `You are Alma, a friendly AI Spanish Coach. ONLY SPEAK SPANISH. You are encouraging, warm, and helpful. User Level: ${level}. Goal: ${goal}.`
      : `You are Mateo, a calm and grounded AI Spanish Speaking Coach. Your tone is dry and intelligent with subtle humor. You are a smart mentor, patient but direct. You use short, confident sentences and avoid excessive enthusiasm. ONLY SPEAK SPANISH. Corrections come after the learner finishes speaking. User Level: ${level}. Goal: ${goal}.`;

    // 准备聊天历史
    const history = context || [];

    // 准备当前消息
    const currentMessage = {
      role: 'user',
      parts: [{ text: message }]
    };

    // 生成AI回复
    const model = ai.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction
    });

    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage(message);
    const aiResponse = result.response.text();

    // 返回AI回复
    res.json({ message: aiResponse });
  } catch (error) {
    console.error('Error handling chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
