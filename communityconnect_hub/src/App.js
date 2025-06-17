import React, { useState, useEffect } from 'react';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  // Caching keys for localStorage
  const CACHE_KEYS = {
    news: 'cc_news',
    weather: 'cc_weather',
    events: 'cc_events',
  };
  const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

  // States
  const [user, setUser] = useState(null);
  const [news, setNews] = useState([]);
  const [weather, setWeather] = useState(null);
  const [events, setEvents] = useState([]);
  const [contacts] = useState([
    { label: 'Police', phone: '911' },
    { label: 'Fire Dept.', phone: '911' },
    { label: 'Ambulance', phone: '911' },
    { label: 'Poison Control', phone: '1-800-222-1222' },
    { label: 'Local Emergency', phone: '311' }
  ]);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // --- DATA FETCH & CACHE HELPERS ---

  // Get cached data with expiry check
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

  // Set cache for a key
  function setCached(key, data) {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  }

  // --- DUMMY API URLs (Replace with real keys) ---
  const NEWS_API = 'https://newsapi.org/v2/top-headlines?country=us&apiKey=demo'; // Replace demo with real key
  const WEATHER_API = 'https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true';
  const EVENTS_API = 'https://open-api.mycommunityconnect.com/events/sample'; // Replace with real endpoint

  // --- EFFECTS: Fetch News, Weather, Events ---
  useEffect(() => {
    async function fetchNews() {
      const cached = getCached(CACHE_KEYS.news);
      if (cached) { setNews(cached); return; }
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

  useEffect(() => {
    async function fetchWeather() {
      const cached = getCached(CACHE_KEYS.weather);
      if (cached) { setWeather(cached); return; }
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

  useEffect(() => {
    async function fetchEvents() {
      const cached = getCached(CACHE_KEYS.events);
      if (cached) { setEvents(cached); return; }
      try {
        // As demo API, mock events
        const nowTs = Date.now();
        const sample = [
          { id: 1, name: "Farmers Market", date: new Date(nowTs + 86400000).toLocaleDateString(), location: "Central Park" },
          { id: 2, name: "Outdoor Movie Night", date: new Date(nowTs + 2 * 86400000).toLocaleDateString(), location: "Riverfront Amphitheater" },
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

  // --- USER MANAGEMENT (Basic/local demo) ---
  // PUBLIC_INTERFACE
  function handleLogin(username, password) {
    // Simulate authentication; add real API call for prod!
    if (username && password) {
      setUser({ username });
      setLoginModalOpen(false);
      localStorage.setItem('cc_user', JSON.stringify({ username }));
    }
  }
  // PUBLIC_INTERFACE
  function handleLogout() {
    setUser(null);
    localStorage.removeItem('cc_user');
  }

  // Check for logged-in user on load
  useEffect(() => {
    const userJson = localStorage.getItem('cc_user');
    if (userJson) setUser(JSON.parse(userJson));
  }, []);

  // --- COMPONENTS ---
  const ColorDot = ({ color }) => (
    <span style={{
      display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: color, marginRight: 8
    }} />
  );

  return (
    <div className="app hub-app">
      {/* NAVBAR */}
      <nav className="navbar hub-navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div className="logo hub-logo">
              <ColorDot color="#c80000" /> CommunityConnect Hub
            </div>
            <div>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#fff' }}>Hi, {user.username}</span>
                  <button className="btn btn-accent" onClick={handleLogout}>Logout</button>
                </div>
              ) : (
                <button className="btn btn-accent" onClick={() => setLoginModalOpen(true)}>Login</button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="hub-main">
        <div className="container hub-content-layout">
          {/* Left: News & Weather */}
          <section className="hub-main-column">
            <h2 className="hub-section-title"><ColorDot color="#c80000" /> Latest News</h2>
            <NewsPanel news={news} loading={!news.length} />

            <h2 className="hub-section-title" style={{ marginTop: 40 }}><ColorDot color="#009600" /> Weather</h2>
            <WeatherPanel weather={weather} loading={!weather} />
          </section>

          {/* Center: Emergency Contacts */}
          <section className="hub-side-column">
            <h2 className="hub-section-title"><ColorDot color="#0000f3" /> Emergency Contacts</h2>
            <ContactsPanel contacts={contacts} />
          </section>

          {/* Right: Events */}
          <section className="hub-main-column">
            <h2 className="hub-section-title"><ColorDot color="#009600" /> Upcoming Local Events</h2>
            <EventsPanel events={events} loading={!events.length} />
          </section>
        </div>
      </main>

      {/* LOGIN MODAL */}
      {loginModalOpen && (
        <LoginModal
          onClose={() => setLoginModalOpen(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}

/// News Panel Component
function NewsPanel({ news, loading }) {
  if (loading) return <div className="hub-card">Loading news...</div>;
  if (!news.length) return <div className="hub-card">No news available.</div>;
  return (
    <div>
      {news.map((article, idx) => (
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
            <div className="hub-news-meta">{article.source?.name} &middot; {article.publishedAt?.slice(0, 10)}</div>
            <div className="hub-news-desc">{article.description}</div>
          </div>
        </a>
      ))}
    </div>
  );
}

/// Weather Panel Component
function WeatherPanel({ weather, loading }) {
  if (loading) return <div className="hub-card">Loading weather...</div>;
  if (!weather) return <div className="hub-card">No weather data.</div>;
  return (
    <div className="hub-card hub-weather-card">
      <div style={{ fontSize: 24 }}>
        {weather.temperature != null ? `${weather.temperature}°C` : "N/A"}
        <span style={{ fontSize: 15, marginLeft: 12 }}>
          {weather.weathercode == null ? '' :
            getWeatherDesc(weather.weathercode)}
        </span>
      </div>
      <div style={{ color: "#aaa", fontSize: 14 }}>
        Winds: {weather.windspeed ?? 'N/A'} km/h
      </div>
      <div style={{ color: "#aaa", fontSize: 14 }}>At: New York, NY (demo)</div>
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

/// Emergency Contacts Panel
function ContactsPanel({ contacts }) {
  return (
    <div className="hub-card hub-contacts-card">
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {contacts.map(c => (
          <li key={c.label} className="hub-contact-item">
            <span className="hub-contact-label">{c.label}</span>
            <a href={`tel:${c.phone}`} className="hub-contact-tel">
              {c.phone}
              <span role="img" aria-label="call" style={{ marginLeft: 6, fontSize: 16 }}>📞</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/// Events Panel
function EventsPanel({ events, loading }) {
  if (loading) return <div className="hub-card">Loading events...</div>;
  if (!events.length) return <div className="hub-card">No events found.</div>;
  return (
    <div>
      {events.map(ev => (
        <div key={ev.id} className="hub-card hub-event-card">
          <div className="hub-event-title">{ev.name}</div>
          <div className="hub-event-when">{ev.date} @ {ev.location}</div>
        </div>
      ))}
    </div>
  );
}

/// Login Modal
function LoginModal({ onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="hub-modal-bg">
      <div className="hub-modal">
        <h3>Sign In</h3>
        <input
          type="text"
          className="hub-input"
          value={username}
          placeholder="Username"
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="hub-input"
          value={password}
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button className="btn btn-accent" onClick={() => onLogin(username, password)}>
            Login
          </button>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

