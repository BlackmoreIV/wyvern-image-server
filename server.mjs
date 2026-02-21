// server.mjs
import express from "express";
import dotenv from "dotenv";
import { fal } from "@fal-ai/client";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FAL_API_KEY = process.env.FAL_API_KEY;

if (!FAL_API_KEY) {
  console.error("FAL_API_KEY が設定されていません。Render の Environment Variables を確認してください。");
  process.exit(1);
}

// Fal.ai に APIキーをセット
fal.apiKey = FAL_API_KEY;

// 保存先ディレクトリ
const PUBLIC_DIR = path.join(process.cwd(), "public");
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);

// 静的ファイル提供
app.use(express.static(PUBLIC_DIR));

// ルート
app.get("/", (req, res) => {
  res.send("画像生成サーバーが起動しています。/generate?q=キーワード で生成可能です。");
});

// 画像生成ルート
app.get("/generate", async (req, res) => {
  const prompt = req.query.q;
  if (!prompt) return res.status(400).send("q パラメータが必要です");

  try {
    // Fal.ai で画像生成
    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: { prompt },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    // Fal.aiの最終画像URL
    const imageUrl = result.data.url || result.data.image_url;
    if (!imageUrl) throw new Error("画像URLが取得できませんでした");

    // 画像をダウンロードして /public/latest.jpg に上書き
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(path.join(PUBLIC_DIR, "latest.jpg"), Buffer.from(arrayBuffer));

    // 固定URLを返す
    res.redirect("/latest.jpg");
  } catch (err) {
    console.error(err);
    res.status(500).send("画像生成に失敗しました");
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});