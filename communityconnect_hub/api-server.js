const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

// Setup - ensure you replace below with your actual NewsAPI key!
const NEWS_API_KEY = "737e634c6ef84eb4a280c96c4ec7815f";
// Weather API Key (do NOT expose this to frontend!)
const WEATHER_API_KEY = "e91a8166503a4e9e967174436251706";

const app = express();
const PORT = process.env.PORT || 3300;

app.use(cors());
app.use(express.json());

// PUBLIC_INTERFACE
// GET /api/news - Proxy for News API, never expose API key to client
app.get("/api/news", async (req, res) => {
  // This endpoint proxies NewsAPI and outputs { articles: [...] }
  // CORS: express cors() middleware allows all origins; adjust as needed for prod

  const country = req.query.country || "us";
  const q = req.query.q ? `&q=${encodeURIComponent(req.query.q)}` : "";

  const url = `https://newsapi.org/v2/top-headlines?country=${country}${q}&apiKey=${NEWS_API_KEY}`;

  try {
    const apiRes = await fetch(url);
    const data = await apiRes.json();

    if (!data.articles) {
      // Pass backend error up for debug, but don't leak to client in prod
      return res.status(502).json({ error: "Failed to fetch news." });
    }

    // Only return the fields the frontend requires
    // Ensure every field exists and fallback so frontend is not confused by undefined
    const articles = data.articles.map(a => ({
      title: a.title || "",
      description: a.description || "",
      url: a.url || "",
      urlToImage: a.urlToImage || "",
      source: a.source || { name: "" },
      publishedAt: a.publishedAt || ""
    }));

    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: "Error fetching news.", details: err.message || err });
  }
});

/**
 * PUBLIC_INTERFACE
 * GET /api/weather - Secure backend proxy for weather data.
 * The API key is never exposed to the frontend.
 * Query: ?lat=<latitude>&lon=<longitude>
 * Example: /api/weather?lat=40.71&lon=-74.01
 */
app.get("/api/weather", async (req, res) => {
  // Use defaults for demonstration if not provided.
  const lat = req.query.lat || "40.71";
  const lon = req.query.lon || "-74.01";

  // The following is an example using OpenWeatherMap API (replace endpoint if your key is for another service)
  // Edit baseUrl as needed if using a different weather provider; ensure key stays server-side.
  const baseUrl = "https://api.openweathermap.org/data/2.5/weather";
  const url = `${baseUrl}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${WEATHER_API_KEY}&units=metric`;

  try {
    const weatherRes = await fetch(url, { timeout: 8000 });
    if (!weatherRes.ok) {
      return res.status(weatherRes.status).json({ error: "Failed to fetch weather." });
    }
    const data = await weatherRes.json();
    // Only return fields the frontend needs (NEVER proxy all data/keys!)
    // Example: main weather info, temperature, wind, etc.
    const safeWeather = {
      temperature: data.main?.temp,
      weathercode: Array.isArray(data.weather) && data.weather.length > 0 ? data.weather[0].id : null,
      windspeed: data.wind?.speed,
      icon: Array.isArray(data.weather) && data.weather.length > 0 ? data.weather[0].icon : null,
      city: data.name,
      country: data.sys?.country || ""
    };
    res.json(safeWeather);
  } catch (err) {
    res.status(500).json({ error: "Error fetching weather.", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`News proxy API running on http://localhost:${PORT}/api/news`);
  console.log(`Weather proxy API running on http://localhost:${PORT}/api/weather`);
});
