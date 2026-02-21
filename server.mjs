// server.mjs
import express from "express";
import dotenv from "dotenv";
import { fal } from "@fal-ai/client";

dotenv.config(); // .env または Render の Environment Variables を読み込む

const app = express();
const PORT = process.env.PORT || 3000;

// 環境変数に APIキーがあるか確認
if (!process.env.FAL_API_KEY) {
  console.error("FAL_API_KEY が設定されていません。Render の Environment Variables を確認してください。");
  process.exit(1);
}

app.get("/", (req, res) => {
  res.send("画像生成サーバーが起動しています。/image?q=キーワード で生成可能です。");
});

app.get("/image", async (req, res) => {
  const prompt = req.query.q;
  if (!prompt) return res.status(400).send("q パラメータが必要です");

  try {
    // 公式サンプル準拠で fal.subscribe を使用
    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: { prompt },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map(log => log.message).forEach(console.log);
        }
      },
    });

    // result.data から画像 URL を取得
    const imageUrl = result.data.url || result.data.image_url;
    if (!imageUrl) throw new Error("画像 URL が返ってきませんでした");

    // ブラウザで直接開ける URL にリダイレクト
    res.redirect(imageUrl);
  } catch (err) {
    console.error("画像生成に失敗しました:", err);
    res.status(500).send("画像生成に失敗しました");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});