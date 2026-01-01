// server.js
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1000,
  }
});

app.use(cors());
app.use(express.json());

// Route tạo bài tập
app.post('/api/generateExercise', async (req, res) => {
  try {
    const { age, fitnessLevel, goals, injuries, equipment, duration } = req.body;
    
    const prompt = `
      Tạo chương trình tập luyện cá nhân hóa với thông tin:
      - Tuổi: ${age}
      - Trình độ: ${fitnessLevel}
      - Mục tiêu: ${goals.join(", ")}
      ${injuries ? `- Chấn thương: ${injuries.join(", ")}` : ""}
      ${equipment ? `- Thiết bị: ${equipment.join(", ")}` : ""}
      ${duration ? `- Thời gian: ${duration} phút` : ""}

      Trả về JSON array với mỗi exercise có:
      - name: string
      - description: string
      - repetitions: number (nếu có)
      - sets: number (nếu có)
      - duration: number (giây)
      - difficulty: "beginner"|"intermediate"|"advanced"
      - muscleGroups: string[]
      - instructions: string[]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON từ response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                     text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const jsonString = jsonMatch[0].replace(/```json\n|```/g, '');
      res.json(JSON.parse(jsonString));
    } else {
      res.status(500).json({ error: "Failed to parse response" });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route phân tích tư thế
app.post('/api/analyzePose', async (req, res) => {
  try {
    const { keypoints, exerciseName, targetRepetitions, currentRep } = req.body;
    
    const keypointsDescription = keypoints
      .map((kp, i) => `Điểm ${i}: (${kp.x}, ${kp.y}) - score: ${kp.score}`)
      .join("\n");

    const prompt = `
      Phân tích tư thế bài tập: ${exerciseName}
      Lần lặp: ${currentRep}/${targetRepetitions}
      
      Keypoints: ${keypointsDescription}
      
      Trả về JSON:
      {
        "accuracy": number 0-100,
        "feedback": string[],
        "corrections": string[],
        "alignment": {
          "shoulders": string,
          "hips": string,
          "knees": string,
          "spine": string
        },
        "tips": string[]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                     text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonString = jsonMatch[0].replace(/```json\n|```/g, '');
      res.json(JSON.parse(jsonString));
    } else {
      res.status(500).json({ error: "Failed to parse response" });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route động viên
app.post('/api/getMotivation', async (req, res) => {
  try {
    const { exercise, progress, userMood, timeOfDay } = req.body;
    
    const prompt = `
      Đưa ra lời động viên ngắn (dưới 50 từ) cho:
      - Bài tập: ${exercise}
      - Tiến độ: ${progress}%
      ${userMood ? `- Tâm trạng: ${userMood}` : ""}
      ${timeOfDay ? `- Thời gian: ${timeOfDay}` : ""}
      
      Giọng văn tích cực, động viên.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json(text);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});