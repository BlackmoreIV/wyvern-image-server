// server.mjs
import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fal } from "@fal-ai/client";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FAL_API_KEY = process.env.FAL_API_KEY;

if (!FAL_API_KEY) {
  console.error("FAL_API_KEY が設定されていません");
  process.exit(1);
}

// Fal.ai クライアント設定
fal.config({ credentials: FAL_API_KEY });

// latest.jpg の保存先
const latestPath = path.join(process.cwd(), "latest.jpg");

// ルート
app.get("/", (req, res) => {
  res.send(
    "画像生成サーバーが起動しています。/generate/キーワード.jpg で生成可能です。"
  );
});

// /generate/:prompt.jpg で画像生成 → latest.jpg に保存 → WyvernChat に URL を返す
app.get("/generate/:prompt.jpg", async (req, res) => {
  const prompt = decodeURIComponent(req.params.prompt);

  try {
    // 画像生成
    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: { prompt }
    });

    const imageUrl =
      result?.data?.images?.[0]?.url ||
      result?.data?.image?.url ||
      result?.data?.url;

    if (!imageUrl) throw new Error("画像URLが見つかりません");

    // 画像を取得して latest.jpg に保存
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(latestPath, buffer);
    console.log(`latest.jpg を更新しました: ${latestPath}`);

    // WyvernChat に最新画像 URL を返す
    res.send(`${req.protocol}://${req.get("host")}/latest.jpg`);
  } catch (err) {
    console.error("Fal Error:", err);
    res.status(500).send("画像生成に失敗しました");
  }
});

// latest.jpg を参照可能に
app.get("/latest.jpg", (req, res) => {
  if (fs.existsSync(latestPath)) {
    res.sendFile(latestPath);
  } else {
    res.status(404).send("latest.jpg はまだ生成されていません");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
