const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

// Setup - ensure you replace below with your actual NewsAPI key!
const NEWS_API_KEY = "737e634c6ef84eb4a280c96c4ec7815f";

const app = express();
const PORT = process.env.PORT || 3300;

app.use(cors());
app.use(express.json());

// PUBLIC_INTERFACE
// GET /api/news - Proxy for News API, never expose API key to client
app.get("/api/news", async (req, res) => {
  // You can optionally allow query params (e.g., ?q=something)
  const country = req.query.country || "us";
  const q = req.query.q ? `&q=${encodeURIComponent(req.query.q)}` : "";

  const url = `https://newsapi.org/v2/top-headlines?country=${country}${q}&apiKey=${NEWS_API_KEY}`;

  try {
    const apiRes = await fetch(url);
    const data = await apiRes.json();

    if (!data.articles) {
      return res.status(502).json({ error: "Failed to fetch news." });
    }

    // Only return the fields the frontend requires (never proxy all!)
    const articles = data.articles.map(a => ({
      title: a.title,
      description: a.description,
      url: a.url,
      urlToImage: a.urlToImage,
      source: a.source,
      publishedAt: a.publishedAt
    }));

    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: "Error fetching news.", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`News proxy API running on http://localhost:${PORT}/api/news`);
});
