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

fal.apiKey = FAL_API_KEY;

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
      input: { prompt },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    // result.data が画像 URL を含む場合
    const imageUrl = result.data.url || result.data.image_url;
    if (!imageUrl) throw new Error("画像 URL が返ってきませんでした");

    res.redirect(imageUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send("画像生成に失敗しました");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});