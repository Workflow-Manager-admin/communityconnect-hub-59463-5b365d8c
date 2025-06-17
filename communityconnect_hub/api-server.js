const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

// --- BEGIN: Performance analysis utilities --- //
/**
 * Times a promise-returning async handler and attaches an "X-Response-Time" header to the response (ms)
 * @param {function(req, res, next)} fn
 */
function timeEndpoint(fn) {
  return async function wrapped(req, res, next) {
    const start = process.hrtime();
    // Monkey-patch res.json and res.send to capture timing
    const send = res.send.bind(res);
    res.send = function (body) {
      const [seconds, ns] = process.hrtime(start);
      const ms = Math.round(seconds * 1000 + ns / 1e6);
      res.set("X-Response-Time", ms + "ms");
      return send(body);
    };
    try {
      await fn(req, res, next);
    } catch (e) {
      next(e);
    }
  };
}

// Log API timing results for bottleneck diagnosis
function logPerformance(endpoint) {
  return (req, res, next) => {
    const start = process.hrtime();
    res.on("finish", () => {
      const [s, ns] = process.hrtime(start);
      const ms = Math.round(s * 1000 + ns / 1e6);
      console.log(`[PERF] ${endpoint} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${ms}ms`);
    });
    next();
  };
}
// --- END: Performance analysis utilities --- //
/**
 * Setup - News API integration:
 * Use the new API key for authenticating all /api/news requests.
 * This key must be kept secure and never exposed to the frontend or any client-side code.
 */
const NEWS_API_KEY = "7eb021fdd0745282f9816f080ee0ab4d";
// Weather API Key (do NOT expose this to frontend!)
const WEATHER_API_KEY = "e91a8166503a4e9e967174436251706";

const app = express();
const PORT = process.env.PORT || 3300;

app.use(cors());
app.use(express.json());

/**
 * PUBLIC_INTERFACE
 * GET /api/news - Proxy for News API, never expose API key to client
 * Wrapped with performance/time logging middleware
 */
app.get(
  "/api/news",
  logPerformance("/api/news"),
  timeEndpoint(async (req, res) => {
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
        const msg = "[NewsAPI ERROR] Invalid or missing articles array in API response";
        console.error(msg, {
          url,
          received: data
        });
        return res.status(502).json({
          error: "Failed to fetch news or no articles found.",
          details: "NewsAPI response did not return an articles array.",
          status: 502,
          providerResponse: data
        });
      }

      // Always warn and return an error if 0 articles are received (Frontend should see as error!)
      if (data.articles.length === 0) {
        const msg = "[NewsAPI WARNING] NewsAPI returned 0 articles for URL:";
        console.warn(msg, url);
        // Return as failure (not just success with empty array), so the frontend can report a problem more clearly.
        return res.status(502).json({
          error: "News API returned no articles.",
          details: "News provider did not supply any news articles for your query.",
          status: 502
        });
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

      // Only return valid result if articles array is truly non-empty and valid.
      return res.json({ articles });
    } catch (err) {
      // Always log exceptions visibly and include stack trace
      console.error("[NewsAPI EXCEPTION]", err && err.stack ? err.stack : err);
      res.status(500).json({
        error: "Error fetching news.",
        details: err && err.message ? err.message : err,
        status: 500
      });
    }
  })
);

/**
 * PUBLIC_INTERFACE
 * GET /api/weather - Secure backend proxy for weather data.
 * The API key is never exposed to the frontend.
 * Query: ?lat=<latitude>&lon=<longitude>
 * Example: /api/weather?lat=40.71&lon=-74.01
 * Wrapped with performance/time logging middleware
 */
app.get(
  "/api/weather",
  logPerformance("/api/weather"),
  timeEndpoint(async (req, res) => {
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
  })
);

// Note: /api/events not implemented in backend
app.listen(PORT, () => {
  console.log(`News proxy API running on http://localhost:${PORT}/api/news`);
  console.log(`Weather proxy API running on http://localhost:${PORT}/api/weather`);
  // No /api/events in this backend: Events are frontend-only or stubbed/sample.
});
