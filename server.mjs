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

// ✅ 正しい認証設定方法
fal.config({
  credentials: FAL_API_KEY
});

app.get("/", (req, res) => {
  res.send(
    "画像生成サーバーが起動しています。/image?q=キーワード で生成可能です。"
  );
});

app.get("/image", async (req, res) => {
  const prompt = req.query.q;
  if (!prompt) return res.status(400).send("q パラメータが必要です");

  try {
    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: { prompt }
    });

    // 最新レスポンス構造に対応
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});