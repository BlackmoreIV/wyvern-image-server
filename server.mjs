// server.mjs
import express from "express";
import dotenv from "dotenv";
import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FAL_API_KEY = process.env.FAL_API_KEY;

if (!FAL_API_KEY) {
  console.error("FAL_API_KEY が設定されていません");
  process.exit(1);
}

// ✅ 正しい認証設定方法
fal.config({
  credentials: FAL_API_KEY
});

// __dirname 用意 (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 既存ルート
app.get("/", (req, res) => {
  res.send(
    "画像生成サーバーが起動しています。/image?q=キーワード で生成可能です。"
  );
});

// 既存 /image ルート
app.get("/image", async (req, res) => {
  const prompt = req.query.q;
  if (!prompt) return res.status(400).send("q パラメータが必要です");

  try {
    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: { prompt }
    });

    const imageUrl =
      result?.data?.images?.[0]?.url ||
      result?.data?.image?.url ||
      result?.data?.url;

    if (!imageUrl) {
      console.log(result);
      throw new Error("画像URLが見つかりません");
    }

    res.redirect(imageUrl);
  } catch (err) {
    console.error("Fal Error:", err);
    res.status(500).send("画像生成に失敗しました");
  }
});

// ⭐ /generate で latest.jpg を生成
app.get("/generate", async (req, res) => {
  const prompt = req.query.q;
  if (!prompt) return res.status(400).send("q パラメータが必要です");

  try {
    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: { prompt }
    });

    const imageUrl =
      result?.data?.images?.[0]?.url ||
      result?.data?.image?.url ||
      result?.data?.url;

    if (!imageUrl) {
      console.log(result);
      throw new Error("画像URLが見つかりません");
    }

    // ⭐ 標準 fetch を使用
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = path.join(__dirname, "latest.jpg");
    fs.writeFileSync(filePath, buffer);

    res.send("latest.jpg を更新しました");
  } catch (err) {
    console.error("Fal Error:", err);
    res.status(500).send("画像生成に失敗しました");
  }
});

// ⭐ latest.jpg 配信用
app.use(express.static(__dirname));

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
