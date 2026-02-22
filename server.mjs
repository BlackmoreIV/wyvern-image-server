// server.mjs
import express from "express";
import dotenv from "dotenv";
import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";
import fetch from "node-fetch"; // Node.js 18 以降は標準 fetch でも可

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FAL_API_KEY = process.env.FAL_API_KEY;

if (!FAL_API_KEY) {
  console.error("FAL_API_KEY が設定されていません");
  process.exit(1);
}

// Fal.ai 認証設定
fal.config({
  credentials: FAL_API_KEY
});

// latest.jpg の保存先
const latestPath = path.join(process.cwd(), "latest.jpg");

// ルート
app.get("/", (req, res) => {
  res.send(
    "画像生成サーバーが起動しています。/image?q=キーワード で生成可能です。/latest.jpg で最新画像を参照可能。"
  );
});

// 画像生成ルート
app.get("/image", async (req, res) => {
  const prompt = req.query.q;
  if (!prompt) return res.status(400).send("q パラメータが必要です");

  try {
    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: { prompt }
    });

    // 生成結果の画像URL
    const imageUrl =
      result?.data?.images?.[0]?.url ||
      result?.data?.image?.url ||
      result?.data?.url;

    if (!imageUrl) {
      console.log(result);
      throw new Error("画像URLが見つかりません");
    }

    // 画像をダウンロードして latest.jpg に保存
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(latestPath, buffer);

    res.send(`生成完了！ /latest.jpg で確認可能です。`);
  } catch (err) {
    console.error("Fal Error:", err);
    res.status(500).send("画像生成に失敗しました");
  }
});

// latest.jpg を静的ファイルとして提供
app.get("/latest.jpg", (req, res) => {
  if (!fs.existsSync(latestPath)) {
    return res.status(404).send("latest.jpg が存在しません");
  }
  res.sendFile(latestPath);
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
