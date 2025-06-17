import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";

// --- SHARED COMPONENTS ---
// PUBLIC_INTERFACE
function ColorDot({ color }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        background: color,
        marginRight: 8
      }}
    />
  );
}

// PUBLIC_INTERFACE
function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar hub-navbar">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <div className="logo hub-logo">
            <ColorDot color="#c80000" /> CommunityConnect Hub
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <NavLinks />
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#fff" }}>Hi, {user.username}</span>
                <button className="btn btn-accent" onClick={onLogout}>Logout</button>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// PUBLIC_INTERFACE
function NavLinks() {
  // style object for links
  const linkStyle = {
    color: "var(--text-color)",
    textDecoration: "none",
    margin: "0 12px",
    padding: "6px 0",
    position: "relative",
    fontWeight: "500",
    letterSpacing: "0.1px"
  };
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <Link to="/" style={linkStyle}>Home</Link>
      <Link to="/news" style={linkStyle}>News</Link>
      <Link to="/weather" style={linkStyle}>Weather</Link>
      <Link to="/events" style={linkStyle}>Events</Link>
      <Link to="/emergency-contacts" style={linkStyle}>Emergency Contacts</Link>
    </div>
  );
}

// --------------- PAGE/ROUTE COMPONENTS ---------------

// PUBLIC_INTERFACE
function HomePage({ news, weather, events, contacts }) {
  return (
    <main className="hub-main">
      <div className="container hub-content-layout">
        {/* Left: News & Weather preview */}
        <section className="hub-main-column">
          <h2 className="hub-section-title">
            <ColorDot color="#c80000" /> Latest News
          </h2>
          <NewsPanel news={news} loading={!news.length} previewCount={2} />

          <h2 className="hub-section-title" style={{ marginTop: 40 }}>
            <ColorDot color="#009600" /> Weather
          </h2>
          <WeatherPanel weather={weather} loading={!weather} previewOnly />
        </section>

        {/* Center: Emergency Contacts preview */}
        <section className="hub-side-column">
          <h2 className="hub-section-title">
            <ColorDot color="#0000f3" /> Emergency Contacts
          </h2>
          <ContactsPanel contacts={contacts} previewOnly />
        </section>

        {/* Right: Events preview */}
        <section className="hub-main-column">
          <h2 className="hub-section-title">
            <ColorDot color="#009600" /> Upcoming Local Events
          </h2>
          <EventsPanel events={events} loading={!events.length} previewCount={2} />
        </section>
      </div>
    </main>
  );
}

// PUBLIC_INTERFACE
function NewsPage({ news }) {
  return (
    <main className="hub-main">
      <div className="container">
        <h1 className="hub-section-title">
          <ColorDot color="#c80000" /> News
        </h1>
        <NewsPanel news={news} loading={!news.length} />
      </div>
    </main>
  );
}

// PUBLIC_INTERFACE
function WeatherPage({ weather }) {
  return (
    <main className="hub-main">
      <div className="container">
        <h1 className="hub-section-title">
          <ColorDot color="#009600" /> Weather
        </h1>
        <WeatherPanel weather={weather} loading={!weather} />
      </div>
    </main>
  );
}

// PUBLIC_INTERFACE
function EventsPage({ events }) {
  return (
    <main className="hub-main">
      <div className="container">
        <h1 className="hub-section-title">
          <ColorDot color="#009600" /> Events
        </h1>
        <EventsPanel events={events} loading={!events.length} />
      </div>
    </main>
  );
}

// PUBLIC_INTERFACE
function EmergencyContactsPage({ contacts }) {
  return (
    <main className="hub-main">
      <div className="container" style={{ maxWidth: 460 }}>
        <h1 className="hub-section-title">
          <ColorDot color="#0000f3" /> Emergency Contacts
        </h1>
        <ContactsPanel contacts={contacts} />
      </div>
    </main>
  );
}

// --------------- PANEL COMPONENTS ---------------

function NewsPanel({ news, loading, previewCount }) {
  let items = news;
  if (previewCount) items = news.slice(0, previewCount);
  if (loading) return <div className="hub-card">Loading news...</div>;
  if (!items.length) return <div className="hub-card">No news available.</div>;
  return (
    <div>
      {items.map((article, idx) => (
        <a
          key={idx}
          href={article.url}
          className="hub-card hub-news-card"
          target="_blank"
          rel="noopener noreferrer"
        >
          {article.urlToImage && (
            <div className="hub-news-img-wrap">
              <img src={article.urlToImage} alt="" className="hub-news-img" loading="lazy" />
            </div>
          )}
          <div>
            <div className="hub-news-title">{article.title}</div>
            <div className="hub-news-meta">
              {article.source?.name} &middot; {article.publishedAt?.slice(0, 10)}
            </div>
            <div className="hub-news-desc">{article.description}</div>
          </div>
        </a>
      ))}
      {previewCount && news.length > previewCount && (
        <Link to="/news" className="btn btn-accent" style={{marginTop: 16, display:'inline-block'}}>See all News</Link>
      )}
    </div>
  );
}

function WeatherPanel({ weather, loading, previewOnly }) {
  if (loading) return <div className="hub-card">Loading weather...</div>;
  if (!weather) return <div className="hub-card">No weather data.</div>;
  return (
    <div className="hub-card hub-weather-card">
      <div style={{ fontSize: 24 }}>
        {weather.temperature != null ? `${weather.temperature}°C` : "N/A"}
        <span style={{ fontSize: 15, marginLeft: 12 }}>
          {weather.weathercode == null ? "" : getWeatherDesc(weather.weathercode)}
        </span>
      </div>
      <div style={{ color: "#aaa", fontSize: 14 }}>
        Winds: {weather.windspeed ?? "N/A"} km/h
      </div>
      <div style={{ color: "#aaa", fontSize: 14 }}>At: New York, NY (demo)</div>
      {previewOnly && <Link to="/weather" className="btn btn-accent" style={{marginTop:14, display:'inline-block'}}>Details</Link>}
    </div>
  );
}

function getWeatherDesc(code) {
  // See Open-Meteo weather code; simple
  if ([0].includes(code)) return "Clear";
  if ([1, 2, 3].includes(code)) return "Partly Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "";
}

function ContactsPanel({ contacts, previewOnly }) {
  const shown = previewOnly ? contacts.slice(0, 3) : contacts;
  return (
    <div className="hub-card hub-contacts-card">
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {shown.map((c) => (
          <li key={c.label} className="hub-contact-item">
            <span className="hub-contact-label">{c.label}</span>
            <a href={`tel:${c.phone}`} className="hub-contact-tel">
              {c.phone}
              <span
                role="img"
                aria-label="call"
                style={{ marginLeft: 6, fontSize: 16 }}
              >
                📞
              </span>
            </a>
          </li>
        ))}
      </ul>
      {previewOnly && contacts.length > shown.length && (
        <Link to="/emergency-contacts" className="btn btn-accent" style={{marginTop: 8, display:'inline-block'}}>See all Contacts</Link>
      )}
    </div>
  );
}

function EventsPanel({ events, loading, previewCount }) {
  let items = events;
  if (previewCount) items = events.slice(0, previewCount);
  if (loading) return <div className="hub-card">Loading events...</div>;
  if (!items.length) return <div className="hub-card">No events found.</div>;
  return (
    <div>
      {items.map((ev) => (
        <div key={ev.id} className="hub-card hub-event-card">
          <div className="hub-event-title">{ev.name}</div>
          <div className="hub-event-when">
            {ev.date} @ {ev.location}
          </div>
        </div>
      ))}
      {previewCount && events.length > previewCount && (
        <Link to="/events" className="btn btn-accent" style={{marginTop: 16, display:'inline-block'}}>See all Events</Link>
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  // Caching keys for localStorage
  const CACHE_KEYS = {
    news: "cc_news",
    weather: "cc_weather",
    events: "cc_events"
  };
  const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

  // States
  const [user, setUser] = React.useState(null);
  const [news, setNews] = React.useState([]);
  const [weather, setWeather] = React.useState(null);
  const [events, setEvents] = React.useState([]);
  const [contacts] = React.useState([
    { label: "Police", phone: "911" },
    { label: "Fire Dept.", phone: "911" },
    { label: "Ambulance", phone: "911" },
    { label: "Poison Control", phone: "1-800-222-1222" },
    { label: "Local Emergency", phone: "311" }
  ]);

  // --- DATA FETCH & CACHE HELPERS ---
  function getCached(key) {
    const itemJson = localStorage.getItem(key);
    if (!itemJson) return null;
    try {
      const { data, timestamp } = JSON.parse(itemJson);
      if (Date.now() - timestamp > CACHE_EXPIRY) return null;
      return data;
    } catch {
      return null;
    }
  }

  function setCached(key, data) {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now()
      })
    );
  }

  // --- DUMMY API URLs (Replace with real keys) ---
  const NEWS_API = "https://newsapi.org/v2/top-headlines?country=us&apiKey=demo"; // Replace demo with real key
  const WEATHER_API =
    "https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true";
  const EVENTS_API = "https://open-api.mycommunityconnect.com/events/sample"; // Replace with real endpoint

  // --- Effects: Fetch News, Weather, Events ---
  React.useEffect(() => {
    async function fetchNews() {
      const cached = getCached(CACHE_KEYS.news);
      if (cached) {
        setNews(cached);
        return;
      }
      try {
        const res = await fetch(NEWS_API);
        const out = await res.json();
        const articles = (out.articles || []).slice(0, 5);
        setNews(articles);
        setCached(CACHE_KEYS.news, articles);
      } catch {
        setNews([]);
      }
    }
    fetchNews();
    // eslint-disable-next-line
  }, []);

  React.useEffect(() => {
    async function fetchWeather() {
      const cached = getCached(CACHE_KEYS.weather);
      if (cached) {
        setWeather(cached);
        return;
      }
      try {
        const res = await fetch(WEATHER_API);
        const out = await res.json();
        const data = out.current_weather || null;
        setWeather(data);
        setCached(CACHE_KEYS.weather, data);
      } catch {
        setWeather(null);
      }
    }
    fetchWeather();
    // eslint-disable-next-line
  }, []);

  React.useEffect(() => {
    async function fetchEvents() {
      const cached = getCached(CACHE_KEYS.events);
      if (cached) {
        setEvents(cached);
        return;
      }
      try {
        // As demo API, mock events
        const nowTs = Date.now();
        const sample = [
          {
            id: 1,
            name: "Farmers Market",
            date: new Date(nowTs + 86400000).toLocaleDateString(),
            location: "Central Park"
          },
          {
            id: 2,
            name: "Outdoor Movie Night",
            date: new Date(nowTs + 2 * 86400000).toLocaleDateString(),
            location: "Riverfront Amphitheater"
          }
        ];
        setEvents(sample);
        setCached(CACHE_KEYS.events, sample);
      } catch {
        setEvents([]);
      }
    }
    fetchEvents();
    // eslint-disable-next-line
  }, []);

  // --- User Management: basic/local demo ---
  // PUBLIC_INTERFACE
  function handleLogout() {
    setUser(null);
    localStorage.removeItem("cc_user");
  }

  // Check for logged-in user on load
  React.useEffect(() => {
    const userJson = localStorage.getItem("cc_user");
    if (userJson) setUser(JSON.parse(userJson));
  }, []);

  return (
    <Router>
      <div className="app hub-app">
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                news={news}
                weather={weather}
                events={events}
                contacts={contacts}
              />
            }
          />
          <Route
            path="/news"
            element={<NewsPage news={news} />}
          />
          <Route
            path="/weather"
            element={<WeatherPage weather={weather} />}
          />
          <Route
            path="/events"
            element={<EventsPage events={events} />}
          />
          <Route
            path="/emergency-contacts"
            element={<EmergencyContactsPage contacts={contacts} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
