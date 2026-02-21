// server.cjs
const express = require('express');
const fetch = require('node-fetch'); // Node.js 18 以降は標準fetchでも可
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const FAL_API_KEY = process.env.FAL_API_KEY;

if (!FAL_API_KEY) {
  console.error("FAL_API_KEY が設定されていません。Render の Environment Variables を確認してください。");
  process.exit(1);
}

async function generateImage(prompt) {
  const response = await fetch('https://api.fal.ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FAL_API_KEY}`
    },
    body: JSON.stringify({
      model: "flux-1/schnell", // 使用するモデル
      prompt: prompt,
      size: "512x512"          // 必要に応じて変更
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fal.ai API エラー: ${response.status} ${text}`);
  }

  const data = await response.json();
  console.log("Fal.ai API response:", data); // ログで確認用
  if (!data.image_url) throw new Error("Fal.ai から画像URLが返っていません");
  return data.image_url;
}

// ルート
app.get('/', (req, res) => {
  res.send("画像生成サーバーが起動しています。/image?q=キーワード で生成可能です。");
});

// 画像生成ルート
app.get('/image', async (req, res) => {
  const prompt = req.query.q;
  if (!prompt) return res.status(400).send("q パラメータが必要です");

  try {
    const imageUrl = await generateImage(prompt);
    res.redirect(imageUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send("画像生成に失敗しました");
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
