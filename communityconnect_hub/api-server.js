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

  // Default country: us (Aligned with frontend expectation)
  const country = req.query.country || "us";
  // Optional search
  const q = req.query.q ? `&q=${encodeURIComponent(req.query.q)}` : "";

  // Validate API Key present
  if (!NEWS_API_KEY) {
    return res.status(500).json({ error: "News API key not configured on server." });
  }

  // Only allow valid country, fallback to us on invalid (keeps API happy)
  const allowedCountries = ["us", "in", "gb", "au", "ca", "fr", "de"];
  const chosenCountry = allowedCountries.includes(country) ? country : "us";

  const url = `https://newsapi.org/v2/top-headlines?country=${chosenCountry}${q}&apiKey=${NEWS_API_KEY}`;

  try {
    const apiRes = await fetch(url);

    if (!apiRes.ok) {
      // Pass along error/status code from upstream if possible
      const errorData = await apiRes.json().catch(() => {});
      const errorMsg = errorData && errorData.message ? errorData.message : "News provider error";
      console.error("[NewsAPI ERROR]", {
        status: apiRes.status,
        url,
        errorMsg,
        errorData
      });
      return res.status(apiRes.status).json({
        error: "Failed to fetch news.",
        details: errorMsg,
        status: apiRes.status,
        providerResponse: errorData || undefined
      });
    }

    const data = await apiRes.json();

    // Defensive: structure expected from NewsAPI is { articles: [] }
    if (!data.articles || !Array.isArray(data.articles)) {
      // If error or API changed format
      console.error("[NewsAPI ERROR] Invalid or missing articles array in API response", {
        url,
        received: data
      });
      return res.status(502).json({
        error: "Failed to fetch news or no articles found.",
        details: "API did not return an articles array.",
        status: 502,
        providerResponse: data
      });
    }

    // Log if we receive empty articles (not a backend error, but helps diagnosis)
    if (data.articles.length === 0) {
      console.warn("[NewsAPI WARNING] NewsAPI returned 0 articles for URL:", url);
    }

    // Ensure every field exists, avoid undefined for React
    const articles = data.articles.map(a => ({
      title: a?.title || "",
      description: a?.description || "",
      url: a?.url || "",
      urlToImage: a?.urlToImage || "",
      source: (a?.source && a.source.name) ? a.source : { name: "" },
      publishedAt: a?.publishedAt || ""
    }));

    res.json({ articles });
  } catch (err) {
    console.error("[NewsAPI EXCEPTION]", err && err.stack ? err.stack : err);
    res.status(500).json({
      error: "Error fetching news.",
      details: err && err.message ? err.message : err,
      status: 500
    });
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
