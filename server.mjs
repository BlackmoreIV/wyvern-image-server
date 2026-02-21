// server.mjs
import express from "express";
import dotenv from "dotenv";
import { fal } from "@fal-ai/client";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FAL_API_KEY = process.env.FAL_API_KEY;

if (!FAL_API_KEY) {
  console.error("FAL_API_KEY が設定されていません");
  process.exit(1);
}

// ★ 0.x 系ではこの書き方でOK
fal.apiKey = FAL_API_KEY;

app.get("/", (req, res) => {
  res.send("画像生成サーバーが起動しています。/image?q=キーワード");
});

app.get("/image", async (req, res) => {
  const prompt = req.query.q;
  if (!prompt) {
    return res.status(400).send("q パラメータが必要です");
  }

  try {
    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: { prompt }
    });

    // 0.x 系では images 配列で返ることが多い
    const imageUrl =
      result?.data?.images?.[0]?.url ||
      result?.data?.url ||
      result?.data?.image_url;

    if (!imageUrl) {
      console.error("Fal からの返却:", result);
      throw new Error("画像URLが取得できませんでした");
    }

    return res.redirect(imageUrl);

  } catch (err) {
    console.error("Fal エラー:", err);
    return res.status(500).send("画像生成に失敗しました");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});