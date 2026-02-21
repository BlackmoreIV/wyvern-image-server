import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/image", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).send("Missing query parameter");

  try {
    // Fal.ai APIに画像生成リクエスト
    const response = await fetch("https://api.fal.ai/v1/images", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: query,
        size: "512x512"
      })
    });

    const data = await response.json();

    // 画像URLにリダイレクト → WyvernChatで直接表示
    res.redirect(data.url);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating image");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
