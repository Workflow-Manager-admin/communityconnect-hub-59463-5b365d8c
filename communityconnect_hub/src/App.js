import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";
import "./App.css";
import ThreeDCarousel from "./ThreeDCarousel";
import { LoginForm, RegisterForm } from "./AuthForms";

// --- SHARED COMPONENTS ---

// PUBLIC_INTERFACE
function ColorDot({ color, animated = false }) {
  // Animated glow for higher interactivity
  const style = {
    display: "inline-block",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: color,
    marginRight: 8,
    boxShadow: animated
      ? `0 0 0 2px ${color}55, 0 0 8px 2px ${color}bb`
      : undefined,
    transition: "box-shadow 0.4s"
  };
  return <span aria-hidden="true" style={style} />;
}

/**
 * PUBLIC_INTERFACE
 * Navbar (navigation links) - sits below main header bar
 */
function Navbar({ user, onLogout, onShowLogin, onShowRegister }) {
  const location = useLocation();
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <nav className="hub-navbar" aria-label="Main navigation">
        <div className="container navbar-row">
          <div className="hub-navbar-links">
            <NavLinks active={location.pathname} />
          </div>
          <div className="hub-navbar-auth">
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#fff" }}>Hi, {user.username}</span>
                <RippleButton
                  className="btn btn-accent"
                  ariaLabel="Log out"
                  onClick={onLogout}
                >
                  Logout
                </RippleButton>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 7 }}>
                <RippleButton
                  className="btn btn-accent"
                  style={{ fontSize: "1rem" }}
                  onClick={onShowLogin}
                >Login</RippleButton>
                <RippleButton
                  className="btn"
                  style={{ fontSize: "1rem" }}
                  onClick={onShowRegister}
                >Register</RippleButton>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

/**
 * PUBLIC_INTERFACE
 * HeaderBar: Large centered website name at very top
 */
function HeaderBar() {
  return (
    <header className="hub-headerbar" role="banner">
      <div className="hub-navbar-title" tabIndex={0} aria-label="CommunityConnect Hub home">
        CommunityConnect Hub
      </div>
    </header>
  );
}

// Button wrapper to add ripple for any element
function RippleButton({ className, style, children, onClick, ariaLabel, ...props }) {
  function handlePointerDown(ev) {
    const btn = ev.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), {once: true});
  }
  return (
    <button
      className={className}
      style={style}
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * PUBLIC_INTERFACE
 * NavLinks: Top navigation menu links (add "Auth" as last link)
 */
function NavLinks({ active }) {
  // Enhanced accessibility & navigation highlight
  const sections = [
    { to: "/", label: "Home" },
    { to: "/news", label: "News" },
    { to: "/weather", label: "Weather" },
    { to: "/events", label: "Events" },
    { to: "/emergency-contacts", label: "Emergency Contacts" },
    { to: "#auth", label: "Auth" }, // Auth as a placeholder (triggers auth modal)
  ];
  function handleNavRipple(ev) {
    const link = ev.currentTarget;
    const rect = link.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    link.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), {once:true});
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {sections.map((section) =>
        section.label !== "Auth" ? (
          <Link
            key={section.to}
            to={section.to}
            className={`hub-nav-link${active === section.to ? " active" : ""}`}
            tabIndex={0}
            aria-current={active === section.to ? "page" : undefined}
            onPointerDown={handleNavRipple}
          >
            {section.label}
            {active === section.to && (
              <span className="hub-nav-underline" />
            )}
          </Link>
        ) : (
          <a
            key="auth"
            href="#auth"
            className={`hub-nav-link${active === "#auth" ? " active" : ""}`}
            tabIndex={0}
            onClick={e => {
              e.preventDefault();
              const btn = document.querySelector('.hub-navbar-auth button.btn-accent');
              if (btn) btn.focus();
            }}
            onPointerDown={handleNavRipple}
          >
            {section.label}
          </a>
        )
      )}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Modernized HomePage: Contemporary hero, advanced layout, visual depth with grid overlays, enhanced cards, modern CTAs, and soft gradients.
 */
function HomePage({ news = [], weather = null, events = [], contacts = [], newsError = null }) {
  const navigate = useNavigate();
  const handleHeroCTAClick = (path) => (e) => {
    e.preventDefault();
    if (navigate) {
      navigate(path);
    } else if (window && window.location) {
      window.location.href = path;
    }
  };

  // Dynamically build carousel slides using current API state.
  // Show: Slide 1: News Highlight | Slide 2: Weather | Slide 3: Featured Event | Slide 4: Emergency Contacts
  // Fallbacks: display static text if data missing, and error message if applicable.

  function NewsSlide() {
    if (newsError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <span style={{ color: "#FF706B", fontWeight: 700, marginBottom: 12 }}>⚠️ News Feed Unavailable</span>
          <span style={{ color: "#fff", fontSize: 15 }}>{newsError}</span>
          <a
            href="/news"
            className="btn btn-accent btn-large hero-btn"
            style={{ marginTop: 13 }}
            onClick={handleHeroCTAClick("/news")}
          >
            See More News
          </a>
        </div>
      );
    }
    if (news && news.length > 0) {
      // Pick top news (first article)
      const top = news[0];
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h2 className="hub-hero-main-title" style={{ marginBottom: 7, fontSize: "2.1rem", fontWeight: 870 }}>
            <span className="hub-hero-main-brand">Chennai Highlights</span>
            <span className="hub-hero-edition-badge" style={{ fontSize: "1.10em"}}>News</span>
          </h2>
          {top.urlToImage && (
            <img
              src={top.urlToImage}
              alt=""
              style={{
                width: 88, height: 88, objectFit: "cover", borderRadius: 13,
                marginBottom: 9, boxShadow: "0 7px 28px #0008"
              }}
              loading="lazy"
              aria-hidden="true"
            />
          )}
          <div style={{ fontWeight: 750, fontSize: "1.11rem", color: "#E87A41", marginBottom: 3 }}>{top.title}</div>
          <div style={{ fontSize: ".99rem", color: "#b4ccd8", marginBottom: 4 }}>{top.description}</div>
          <div style={{ color: "#999", fontSize: ".91em", marginBottom: 7 }}>
            {(top.source && top.source.name)
              ? <>{top.source.name} &bull; {top.publishedAt?.slice?.(0,10)}</>
              : null}
          </div>
          <a
            href={top.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-accent"
            style={{ marginBottom: 6 }}
          >
            Read More
          </a>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <span className="hub-hero-main-title" style={{ fontSize: "1.4rem", marginBottom: 7 }}>
          <span className="hub-hero-main-brand">Latest News</span>
        </span>
        <span style={{ color: "#fff", marginBottom: "13px" }}>Loading top news for Chennai...</span>
        <div className="hub-loading-anim" />
      </div>
    );
  }

  function WeatherSlide() {
    if (weather) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h2 style={{
            fontWeight: 900, fontSize: "2.05rem", margin: "0 0 7px 0", letterSpacing: ".01em",
            color: "var(--secondary)"
          }}>
            <span role="img" aria-label="weather" style={{ marginRight: 9 }}>☀️</span>
            Chennai Weather
          </h2>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: 3 }}>
            {weather.temperature != null ? `${weather.temperature}°C` : "N/A"}
          </div>
          <div style={{ fontSize: "1.04rem", color: "#bbb", marginBottom: 2 }}>
            {weather.weathercode == null ? "" : getWeatherDesc(weather.weathercode)}
          </div>
          <div style={{ color: "#aaa", fontSize: 15, marginBottom: 4 }}>
            Winds: {weather.windspeed ?? "N/A"} km/h
          </div>
          <div style={{ color: "#6ecb8f", fontSize: ".99em", marginBottom: 7 }}>
            At: Chennai, India
          </div>
          <a
            href="/weather"
            className="btn btn-large hero-btn"
            style={{ background: "var(--secondary)", color: "#fff" }}
            onClick={handleHeroCTAClick("/weather")}
          >
            <span role="img" aria-label="weather" style={{ marginRight: 7 }}>🌦️</span>
            Full Forecast
          </a>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <h2 style={{
          fontWeight: 900, fontSize: "2.05rem", margin: "0 0 7px 0", letterSpacing: ".01em",
          color: "var(--secondary)"
        }}>
          <span role="img" aria-label="weather" style={{ marginRight: 9 }}>☀️</span>
          Chennai Weather
        </h2>
        <span style={{ color: "#fff", marginBottom: "17px" }}>Loading weather...</span>
        <div className="hub-loading-anim" />
      </div>
    );
  }

  function EventSlide() {
    if (events && events.length > 0) {
      const e = events[0];
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h2 style={{ fontWeight: 900, fontSize: "2.04rem", margin: "0 0 7px 0", letterSpacing: ".02em", color: "var(--primary)" }}>
            <span role="img" aria-label="events" style={{ marginRight: 7 }}>🎉</span>
            Upcoming Event
          </h2>
          <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "#18bd2c", marginBottom: 4 }}>{e.name}</div>
          <div style={{ fontSize: ".999em", color: "#d5f2ff", fontWeight: 500, marginBottom: 6 }}>
            <span role="img" aria-label="calendar">📅</span>&nbsp;{e.date}
          </div>
          <div style={{ fontSize: ".98em", color: "#fff", marginBottom: 7 }}>
            <span role="img" aria-label="map">📍</span>&nbsp;{e.location}
          </div>
          {e.description && (
            <div style={{ color: "#bfffcf", marginBottom: 5, fontSize: ".98em" }}>{e.description}</div>
          )}
          <a
            href="/events"
            className="btn btn-large hero-btn"
            style={{
              background: "linear-gradient(88deg, #c80000 25%, #009600 70%, #0000f3 100%)",
              color: "#fff"
            }}
            onClick={handleHeroCTAClick("/events")}
          >
            <span role="img" aria-label="events" style={{ marginRight: 6 }}>📅</span>
            More Events
          </a>
        </div>
      );
    }
    // Fallback for empty/no events
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <h2 style={{ fontWeight: 900, fontSize: "2.04rem", margin: "0 0 7px 0", letterSpacing: ".02em", color: "var(--primary)" }}>
          <span role="img" aria-label="events" style={{ marginRight: 7 }}>🎉</span>
          Upcoming Event
        </h2>
        <span style={{ color: "#fff", marginBottom: "17px" }}>Loading event details...</span>
        <div className="hub-loading-anim" />
      </div>
    );
  }

  function ContactsSlide() {
    // Show 2-3 emergency contacts for preview
    const preview = Array.isArray(contacts) ? contacts.slice(0,3) : [];
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <h2 style={{ fontWeight: 900, fontSize: "2.01rem", margin: "0 0 7px 0", letterSpacing: ".01em", color: "var(--accent)" }}>
          <span role="img" aria-label="contacts" style={{ marginRight: 8 }}>🆘</span>
          Emergency Contacts
        </h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, marginBottom: "13px" }}>
          {preview.map((c, i) => (
            <li key={c.label + c.phone} style={{
              marginBottom: i < preview.length - 1 ? "8px" : "0",
              fontSize: "1.025em", color: "#d5e2ff", display: "flex", alignItems: "center", gap: 7
            }}>
              <span className="hub-contact-label" style={{ color: "#00aaff", fontWeight: 600 }}>{c.label}:</span>
              <a href={`tel:${c.phone}`} style={{
                color: "#4fd674",
                fontWeight: 700,
                textDecoration: "underline",
                letterSpacing: ".01em"
              }}>
                {c.phone}
                <span role="img" aria-label="call" style={{ marginLeft: 6, fontSize: 16 }}>
                  📞
                </span>
              </a>
            </li>
          ))}
        </ul>
        <a
          href="/emergency-contacts"
          className="btn btn-large hero-btn"
          style={{ background: "var(--accent)", color: "#fff" }}
          onClick={handleHeroCTAClick("/emergency-contacts")}
        >
          <span role="img" aria-label="contacts" style={{ marginRight: 8 }}>📱</span>
          All Contacts
        </a>
      </div>
    );
  }

  // Compose dynamic slides, using new objects for announcements/banners which are auto-rendered with icon/banner styles by the enhanced ThreeDCarousel
  const slides = [
    // Demo/dynamic Announcement (always first)
    {
      type: "announcement",
      title: "Community Clean-up: April 28th, Join Us!",
      message: "Let’s keep our parks clean. Volunteers needed for this Sunday’s morning drive. All ages welcome!",
      link: "/events"
    },
    // Static promotional banner slide
    {
      type: "banner",
      title: "Welcome to the New CommunityConnect Hub!",
      message: "Your gateway to local news, weather, events, and community resources.",
      icon: "⭐",
      cta: "About Us",
      link: "/about"
    },
    // Dynamic News slide: flatten props for 3D carousel
    news && news.length > 0 && {
      type: "news",
      ...news[0]
    },
    // Dynamic Weather slide
    weather && {
      type: "weather",
      ...weather
    },
    // Dynamic Contacts (preview style for 3D)
    contacts && {
      type: "announcement",
      title: "Emergency Contacts Quick Preview",
      message: (Array.isArray(contacts) && contacts.length)
        ? contacts.slice(0,3).map(c=>`${c.label}: ${c.phone}`).join("  |  ")
        : "Swipe to see all important contacts.",
      link: "/emergency-contacts"
    },
    // Next event (dynamic)
    events && events.length > 0 && {
      type: "event",
      ...events[0]
    },
    // Additional community "alert" as demo
    {
      type: "community",
      title: "Water Outage Notice",
      message: "Planned water supply interruption on May 3 (Thurs) from 8am-2pm for pipe repair in Adyar zone. Please store water.",
      link: "/news"
    }
  ].filter(Boolean);

  return (
    <main className="hub-main hub-homepage-main">
      <section className="hub-hero-section hub-section-entrance enhanced-hero" style={{ background: "none", boxShadow: "none", padding: "40px 0 0 0", minHeight: "unset" }}>
        {/* Animate glass/gradient background on parent */}
        <div className="hero-bg-visuals" aria-hidden>
          <svg width="100%" height="100%" viewBox="0 0 820 260" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}>
            <ellipse cx="630" cy="108" rx="188" ry="80" fill="#0000f319" />
            <ellipse cx="170" cy="177" rx="115" ry="62" fill="#c8000044" />
            <ellipse cx="410" cy="220" rx="360" ry="70" fill="#1a1a1a" fillOpacity={0.10} />
          </svg>
        </div>
        {/* 3D Carousel: supports new slide types & richer banner styling. Tweak speed, visible count, and perspective for more pop */}
        <ThreeDCarousel
          slides={slides}
          autoRotate={false}
          visibleSlideCount={5}  // Set to 5 for best 3D pop, adjust as needed
          perspective={1970}    // Deeper 3D illusion
        />
        {/* Visual glass grid overlay retained for cohesion */}
        <div className="hero-glass-grid" aria-hidden>
          <div /><div /><div /><div /><div />
        </div>
      </section>
    </main>
  );
}



// PUBLIC_INTERFACE
function NewsPage({ news, newsError }) {
  return (
    <main className="hub-main">
      <div className="container">
        <h1 className="hub-section-title">
          <ColorDot color="#c80000" /> News
        </h1>
        <NewsPanel news={news} loading={!news.length && !newsError} error={newsError} />
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

/**
 * PUBLIC_INTERFACE
 * EventsPage: Displays events and, for authenticated users, shows an event addition form.
 */
function EventsPage({ events, user, onAddEvent }) {
  return (
    <main className="hub-main">
      <div className="container">
        <h1 className="hub-section-title">
          <ColorDot color="#009600" /> Events in Chennai
        </h1>
        <EventsPanel
          events={events}
          loading={!events.length}
          showChennaiNotice
          user={user}
          onAddEvent={onAddEvent}
        />
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

function NewsPanel({ news, loading, previewCount, error }) {
  let items = news;
  if (previewCount) items = news.slice(0, previewCount);

  if (loading)
    return (
      <div className="hub-card hub-section-entrance" style={{ color: "#ffffff", backgroundColor: "#1a1a1a", fontWeight: "500" }}>
        <span className="hub-loading-anim" /> Loading news...
      </div>
    );

  if (error)
    return (
      <div className="hub-card hub-section-entrance" style={{ color: "#FF706B", backgroundColor: "#262626", fontWeight: "500" }}>
        <span style={{ marginRight: 8, fontWeight: 600 }}>⚠️ News Feed Unavailable</span>
        <br />
        <span style={{ fontSize: "1em", color: "#fff" }}>{error}</span>
      </div>
    );

  if (!items.length)
    return (
      <div className="hub-card hub-section-entrance">
        No news available.
      </div>
    );

  function handleRipple(ev) {
    const btn = ev.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    const ripple = document.createElement("span");
    ripple.className = "btn-ripple";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  }

  return (
    <div className="hub-section-entrance">
      {items.map((article, idx) => (
        <a
          key={idx}
          href={article.url}
          className="hub-card hub-news-card"
          target="_blank"
          rel="noopener noreferrer"
          onPointerDown={handleRipple}
        >
          {article.urlToImage && (
            <div className="hub-news-img-wrap">
              <img src={article.urlToImage} alt="" className="hub-news-img" loading="lazy" />
            </div>
          )}
          <div>
            <div className="hub-news-title">{article.title}</div>
            <div className="hub-news-meta">
              {article.source?.name} · {article.publishedAt?.slice(0, 10)}
            </div>
            <div className="hub-news-desc">{article.description}</div>
          </div>
        </a>
      ))}
      {previewCount && news.length > previewCount && (
        <Link to="/news" className="btn btn-accent" onPointerDown={handleRipple} style={{marginTop: 16, display:"inline-block"}}>See all News</Link>
      )}
    </div>
  );
}

function WeatherPanel({ weather, loading, previewOnly }) {
  if (loading)
    return (
      <div className="hub-card hub-weather-card hub-section-entrance">
        <span className="hub-loading-anim" /> Loading weather...
      </div>
    );
  if (!weather)
    return <div className="hub-card hub-weather-card hub-section-entrance">No weather data.</div>;
  function handleRipple(ev) {
    const btn = ev.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), {once: true});
  }
  return (
    <div className="hub-card hub-weather-card hub-section-entrance">
      <div style={{ fontSize: 24 }}>
        {weather.temperature != null ? `${weather.temperature}°C` : "N/A"}
        <span style={{ fontSize: 15, marginLeft: 12 }}>
          {weather.weathercode == null ? "" : getWeatherDesc(weather.weathercode)}
        </span>
      </div>
      <div style={{ color: "#aaa", fontSize: 14 }}>
        Winds: {weather.windspeed ?? "N/A"} km/h
      </div>
      <div style={{ color: "#aaa", fontSize: 14 }}>
        At: Chennai, India
      </div>
      {previewOnly && <Link to="/weather" className="btn btn-accent" style={{marginTop:14, display:'inline-block'}} onPointerDown={handleRipple}>Details</Link>}
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
  // Categorize contacts for Chennai: groups for display
  const GROUPS = [
    {
      name: "Emergency Services",
      test: label =>
        /police|fire|ambulance|disaster|traffic/i.test(label),
    },
    {
      name: "Homes & Night Shelters",
      test: label =>
        /shelter|homeless|night/i.test(label),
    },
    {
      name: "Food & Relief Centers",
      test: label =>
        /food|distribution|kitchen/i.test(label),
    },
    {
      name: "Relief Camps & Temporary Housing",
      test: label =>
        /camp|relief|housing|cyclone/i.test(label),
    },
    {
      name: "Child & Women Helplines",
      test: label =>
        /child|women/i.test(label),
    }
  ];

  // Group contacts
  const groupedContacts = GROUPS.map(group => ({
    name: group.name,
    contacts: contacts.filter(c => group.test(c.label))
  })).filter(group => group.contacts.length > 0);

  // If previewOnly, flatten to show first 3 overall (regardless of category)
  if (previewOnly) {
    const shown = contacts.slice(0, 3);
    return (
      <div className="hub-card hub-contacts-card hub-section-entrance">
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {shown.map((c) => (
            <li key={c.label} className="hub-contact-item">
              <span className="hub-contact-label">{c.label}</span>
              <a href={`tel:${c.phone}`} className="hub-contact-tel" onPointerDown={ev => {
                const btn = ev.currentTarget;
                const rect = btn.getBoundingClientRect();
                const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
                const ripple = document.createElement('span');
                ripple.className = 'btn-ripple';
                ripple.style.left = x + "px";
                ripple.style.top = y + "px";
                btn.appendChild(ripple);
                ripple.addEventListener('animationend', () => ripple.remove(), {once: true});
              }}>
                {c.phone}
                <span role="img" aria-label="call" style={{ marginLeft: 6, fontSize: 16 }}>
                  📞
                </span>
              </a>
            </li>
          ))}
        </ul>
        {contacts.length > shown.length && (
          <Link to="/emergency-contacts" className="btn btn-accent" style={{marginTop: 8, display:'inline-block'}} onPointerDown={ev => {
            const btn = ev.currentTarget;
            const rect = btn.getBoundingClientRect();
            const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
            const ripple = document.createElement('span');
            ripple.className = 'btn-ripple';
            ripple.style.left = x + "px";
            ripple.style.top = y + "px";
            btn.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove(), {once: true});
          }}>See all Contacts</Link>
        )}
      </div>
    );
  }

  // Render full contact list, grouped with clear headers
  function handleRipple(ev) {
    const btn = ev.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), {once: true});
  }

  return (
    <div className="hub-card hub-contacts-card hub-section-entrance">
      {groupedContacts.map(group => (
        <div key={group.name} style={{marginBottom: 12}}>
          <div style={{
            color: "#56d0ff",
            fontWeight: 700,
            fontSize: "1.08em",
            marginBottom: 7,
            letterSpacing: 0.01
          }}>{group.name}</div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {group.contacts.map(c => (
              <li key={c.label} className="hub-contact-item">
                <span className="hub-contact-label">{c.label}</span>
                <a href={`tel:${c.phone}`} className="hub-contact-tel" onPointerDown={handleRipple}>
                  {c.phone}
                  <span role="img" aria-label="call" style={{ marginLeft: 6, fontSize: 16 }}>
                    📞
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// Updated EventsPanel to support event adding and display as described
function EventsPanel({ events, loading, previewCount, showChennaiNotice, user, onAddEvent }) {
  // Extended event form to support: title, date, location, and description
  const [form, setForm] = React.useState({ name: "", date: "", location: "", description: "" });
  const [addErr, setAddErr] = React.useState("");
  const [addMsg, setAddMsg] = React.useState("");
  let items = events;
  if (previewCount) items = events.slice(0, previewCount);

  if (loading)
    return (
      <div className="hub-card hub-event-card hub-section-entrance">
        <span className="hub-loading-anim" /> Loading events...
      </div>
    );
  if (!items.length)
    return <div className="hub-card hub-event-card hub-section-entrance">No events found.</div>;

  function handleRipple(ev) {
    const btn = ev.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), {once: true});
  }

  function handleEventFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setAddErr("");
    setAddMsg("");
  }

  function handleAddEvent(e) {
    e.preventDefault();
    setAddErr("");
    setAddMsg("");

    // Simple validation
    if (!form.name.trim() || !form.date.trim() || !form.location.trim() || !form.description.trim()) {
      setAddErr("All fields are required.");
      return;
    }
    // Chennai location validation
    if (!/chennai/i.test(form.location)) {
      setAddErr("Location must be within Chennai.");
      return;
    }
    // Description length validation
    if (form.description.trim().length < 10) {
      setAddErr("Description should be at least 10 characters.");
      return;
    }
    // All checks pass: Add event via callback
    if (onAddEvent) {
      onAddEvent({
        id: Date.now(),
        name: form.name.trim(),
        date: form.date.trim(),
        location: form.location.trim(),
        description: form.description.trim()
      });
      setAddMsg("Event added!");
      setForm({ name: "", date: "", location: "", description: "" });
    }
  }

  return (
    <div className="hub-section-entrance">
      {showChennaiNotice && (
        <div style={{
          color: "#56e095",
          fontWeight: 600,
          fontSize: "1.01rem",
          marginBottom: 8,
          letterSpacing: 0.02
        }}>
          Only showing local events in <span style={{color: "#00e2ca"}}>Chennai</span>.
        </div>
      )}
      {user && onAddEvent && (
        <form onSubmit={handleAddEvent} className="hub-card hub-event-card" style={{marginBottom: 19, background: "#232338ed"}}>
          <div className="hub-event-title" style={{marginBottom: 7}}>
            Add a Chennai Event
          </div>
          <input
            className={`hub-input${addErr && !form.name.trim() ? " error" : ""}`}
            type="text"
            name="name"
            placeholder="Event Name"
            value={form.name}
            onChange={handleEventFormChange}
            required
            style={{marginBottom: 7}}
            maxLength={64}
            autoComplete="off"
          />
          <input
            className={`hub-input${addErr && !form.date.trim() ? " error" : ""}`}
            type="date"
            name="date"
            value={form.date}
            onChange={handleEventFormChange}
            required
            style={{marginBottom: 7}}
          />
          <input
            className={`hub-input${addErr && (!form.location.trim() || !/chennai/i.test(form.location)) ? " error" : ""}`}
            type="text"
            name="location"
            placeholder="Location (must include Chennai)"
            value={form.location}
            onChange={handleEventFormChange}
            required
            style={{marginBottom: 7}}
            maxLength={64}
            autoComplete="off"
          />
          <textarea
            className={`hub-input${addErr && (!form.description.trim() || form.description.trim().length < 10) ? " error" : ""}`}
            name="description"
            placeholder="Description (at least 10 chars)"
            value={form.description}
            onChange={handleEventFormChange}
            required
            style={{marginBottom: 7, minHeight: 52, fontFamily: "inherit", resize: "vertical"}}
            minLength={10}
            maxLength={260}
            autoComplete="off"
          />
          {addErr && <div style={{color: "#e87a41", fontSize: 14, marginBottom: 6}}>{addErr}</div>}
          {addMsg && <div style={{color: "#4ee144", fontSize: 14, marginBottom: 6}}>{addMsg}</div>}
          <button className="btn btn-accent btn-large" type="submit" style={{width: "100%"}} onPointerDown={handleRipple}>
            Add Event
          </button>
        </form>
      )}
      {items.map((ev) => (
        <div key={ev.id} className="hub-card hub-event-card" tabIndex={0} style={{marginBottom: 18}}>
          <div className="hub-event-title">{ev.name}</div>
          <div className="hub-event-when" style={{marginBottom: 6}}>
            <span role="img" aria-label="calendar" style={{marginRight: 3}}>📅</span> {ev.date}
            <span aria-label="at" style={{fontWeight: 400, margin: "0 6px"}}>@</span>
            <span role="img" aria-label="map" style={{marginRight: 3}}>📍</span> {ev.location}
          </div>
          {ev.description && (
            <div style={{fontSize: ".99rem", color: "#bfffcf", marginBottom: 5, fontWeight: 400, whiteSpace: "pre-line"}}>
              {ev.description}
            </div>
          )}
        </div>
      ))}
      {previewCount && events.length > previewCount && (
        <Link
          to="/events"
          className="btn btn-accent"
          style={{marginTop: 16, display:'inline-block'}}
          onPointerDown={handleRipple}
        >
          See all Events in Chennai
        </Link>
      )}
    </div>
  );
}

// ----------------------------
// MAIN APP COMPONENT
// ----------------------------

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
  const [newsError, setNewsError] = React.useState(null); // <-- Added error state for news
  const [weather, setWeather] = React.useState(null);
  const [events, setEvents] = React.useState([]);
  // Chennai-specific emergency contacts, including new categories
  const [contacts] = React.useState([
    // Core Emergencies
    { label: "Police (Chennai)", phone: "100" },
    { label: "Fire and Rescue (Chennai)", phone: "101" },
    { label: "Ambulance (108 Emergency)", phone: "108" },
    { label: "Disaster Management Chennai Corporation", phone: "1913" },
    { label: "Chennai Traffic Police", phone: "103" },
    // Homes & Shelters
    { label: "Night Shelter (Ripon Building)", phone: "044-2561 0200" },
    { label: "Homeless Resource Center (Arumbakkam)", phone: "044-2475 1609" },
    { label: "CMC Night Shelter (Egmore)", phone: "044-2819 0522" },
    // Food & Relief Shelters
    { label: "Food Helpline (Greater Chennai)", phone: "044-25384520" },
    { label: "IRCS Food Distribution Center", phone: "044-2819 2145" },
    { label: "Akshaya Patra Kitchen (Guindy)", phone: "044-2247 0279" },
    // Camps & Temporary Housing
    { label: "Govt. Relief Camp (Saidapet)", phone: "044-2235 2323" },
    { label: "Flood Relief Camp (Perambur)", phone: "044-2670 1501" },
    { label: "Cyclone Shelter (Thiruvottiyur)", phone: "044-2591 2233" },
    // Child & Women Help
    { label: "Child Helpline", phone: "1098" },
    { label: "Women Helpline (Tamil Nadu)", phone: "1091" }
  ]);

  // --- User authentication modal state ---
  const [authModal, setAuthModal] = React.useState(null); // 'login', 'register', or null
  const [authLoading, setAuthLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState("");

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

  // --- API URLs ---
  let NEWS_API = "/api/news";
  let WEATHER_API = "/api/weather";
  const EVENTS_API = "https://open-api.mycommunityconnect.com/events/sample";

  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost" &&
    window.location.port !== "3300"
  ) {
    NEWS_API = "http://localhost:3300/api/news";
    WEATHER_API = "http://localhost:3300/api/weather";
  }

  // --- Effects: Fetch News, Weather, Events ---
  React.useEffect(() => {
    let active = true;
    let refreshInterval = null;

    // PUBLIC_INTERFACE
    async function fetchNews(force = false) {
      if (!force) {
        const cached = getCached(CACHE_KEYS.news);
        if (cached && cached.length > 0) {
          setNews(cached);
          setNewsError(null);
          return;
        }
      }
      try {
        setNewsError(null);
        let API_URL = NEWS_API;
        if (process.env.REACT_APP_API_BASE) {
          API_URL = `${process.env.REACT_APP_API_BASE}/api/news`;
        }
        const res = await fetch(API_URL, {
          credentials: "include"
        });
        let out;
        try {
          out = await res.json();
        } catch (e) {
          out = null;
        }

        if (out && (out.error || out.status >= 400)) {
          // eslint-disable-next-line
          console.error("NewsAPI backend error:", out);
          if (active) {
            setNews([]);
            setNewsError(
              out.details
                ? `${out.error || "Failed to fetch news."} (${out.details})`
                : out.error || "Failed to fetch news."
            );
          }
          return;
        }

        if (!res.ok) {
          // eslint-disable-next-line
          console.error(
            "Failed HTTP for news fetch. Status:",
            res.status,
            out || ""
          );
          // Enhanced: log fetch text for debugging if possible
          try {
            res.clone().text().then(txt => {
              // eslint-disable-next-line
              console.warn("NewsAPI fetch returned non-ok response. Text body:", txt);
            });
          } catch (e) {}
          if (active) {
            setNews([]);
            setNewsError(
              (out && (out.error || out.details)) ||
                `Failed to fetch news (HTTP ${res.status}).`
            );
          }
          return;
        }

        let articles = [];
        if (out && Array.isArray(out.articles)) {
          articles = out.articles.slice(0, 5); // Show top 5
        } else {
          if (Array.isArray(out?.data?.articles)) {
            articles = out.data.articles.slice(0, 5);
          } else if (Array.isArray(out?.data)) {
            articles = out.data.slice(0, 5);
          }
        }

        if (!articles.length) {
          // eslint-disable-next-line
          console.warn(
            "NewsAPI proxy returned 0 news articles to UI. User will see a notice."
          );
          if (active) {
            setNews([]);
            setNewsError("No news available from provider at this time.");
          }
          return;
        }

        if (active) {
          setNews(articles);
          setNewsError(null);
          setCached(CACHE_KEYS.news, articles);
        }
      } catch (err) {
        // eslint-disable-next-line
        console.error(
          "Error fetching news (frontend):",
          err && err.message ? err.message : err
        );
        // If error object has stack/log more
        if (err && err.stack) {
          // eslint-disable-next-line
          console.error("News fetch stack trace (frontend):", err.stack);
        }
        if (active) {
          setNews([]);
          setNewsError(
            err && err.message
              ? `Unable to reach news service: ${err.message}`
              : "News feed is unavailable due to an error."
          );
        }
      }
    }

    fetchNews();

    refreshInterval = setInterval(() => fetchNews(true), 2 * 60 * 1000);

    return () => {
      active = false;
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  React.useEffect(() => {
    // Chennai coordinates: lat=13.0827, lon=80.2707
    async function fetchWeather() {
      const cached = getCached(CACHE_KEYS.weather);
      if (cached) {
        setWeather(cached);
        return;
      }
      try {
        const chennaiLat = "13.0827";
        const chennaiLon = "80.2707";
        let API_URL = `${WEATHER_API}?lat=${chennaiLat}&lon=${chennaiLon}`;
        if (
          typeof window !== "undefined" &&
          window.location.hostname === "localhost"
        ) {
          API_URL = `http://localhost:3300/api/weather?lat=${chennaiLat}&lon=${chennaiLon}`;
        }
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to fetch weather from proxy");
        const out = await res.json();
        setWeather(out);
        setCached(CACHE_KEYS.weather, out);
      } catch {
        setWeather(null);
      }
    }
    fetchWeather();
  }, []);

  React.useEffect(() => {
    async function fetchEvents() {
      const cached = getCached(CACHE_KEYS.events);
      if (cached) {
        setEvents(cached);
        return;
      }
      try {
        const now = new Date();
        // Preset sample events in Chennai with realistic info
        const chennaiEvents = [
          {
            id: 1,
            name: "Marina Beach Cleanup Drive",
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toLocaleDateString(),
            location: "Marina Beach, Chennai",
            description: "Join volunteers to help keep Marina Beach clean. Free refreshments will be provided. Open for all age groups."
          },
          {
            id: 2,
            name: "Thiruvanmiyur Organic Farmer's Market",
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5).toLocaleDateString(),
            location: "Thiruvanmiyur, Chennai",
            description: "Support local organic farmers! Fresh produce, crafts, and workshops every Sunday morning at Thiruvanmiyur."
          },
          {
            id: 3,
            name: "Classical Carnatic Concert: Music for All",
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toLocaleDateString(),
            location: "Music Academy, Chennai",
            description: "An enchanting evening of Carnatic music featuring leading artists. Entry free for students. Seats fill fast!"
          },
          {
            id: 4,
            name: "Chennai Book Fair",
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10).toLocaleDateString(),
            location: "YMCA Grounds, Nandanam, Chennai",
            description: "The city's largest annual book fair – books, literary talks, and children's activities. Every day 10am–8pm for 2 weeks."
          },
          {
            id: 5,
            name: "Heritage Walk: Fort St. George",
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 13).toLocaleDateString(),
            location: "Fort St. George, Chennai",
            description: "Explore Chennai's colonial past with a guided tour in English & Tamil. Registration required; limited to 30 participants."
          },
          {
            id: 6,
            name: "Startup Networking Night",
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15).toLocaleDateString(),
            location: "Tidel Park, Chennai",
            description: "Pitch your startup idea or connect with founders and VCs. Free pizza and beverages for all attendees. RSVP online."
          },
          {
            id: 7,
            name: "Inter-school Robotics Challenge",
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 17).toLocaleDateString(),
            location: "Anna University, Chennai",
            description: "Witness innovative solutions as school teams compete with their robots for the city trophy. Open to public."
          },
          {
            id: 8,
            name: "Kolam Art Workshop",
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 19).toLocaleDateString(),
            location: "Besant Nagar Beach, Chennai",
            description: "Learn traditional kolam art from local women artisans. All materials provided; prior registration recommended."
          },
          {
            id: 9,
            name: "Community Medical Camp",
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21).toLocaleDateString(),
            location: "Saidapet Community Hall, Chennai",
            description: "Free health check-ups and doctor consultations for all residents. Blood donation drive also conducted on-site."
          },
        ];
        setEvents(chennaiEvents);
        setCached(CACHE_KEYS.events, chennaiEvents);
      } catch {
        setEvents([]);
      }
    }
    fetchEvents();
  }, []);

  // --- User Management: local (demo) authentication logic ---

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

  // PUBLIC_INTERFACE
  function handleShowLogin() {
    setAuthModal("login");
    setAuthError("");
  }
  // PUBLIC_INTERFACE
  function handleShowRegister() {
    setAuthModal("register");
    setAuthError("");
  }

  // PUBLIC_INTERFACE
  function handleLogin({ email, password }) {
    setAuthLoading(true);
    setAuthError("");
    setTimeout(() => {
      setAuthLoading(false);
      const users = JSON.parse(localStorage.getItem("cc_users") || "[]");
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        const u = { username: user.email.split("@")[0], email: user.email };
        setUser(u);
        localStorage.setItem("cc_user", JSON.stringify(u));
        setAuthModal(null);
      } else {
        setAuthError("Invalid email or password.");
      }
    }, 600);
  }

  // PUBLIC_INTERFACE
  function handleRegister({ email, password }) {
    setAuthLoading(true);
    setAuthError("");
    setTimeout(() => {
      let users = JSON.parse(localStorage.getItem("cc_users") || "[]");
      if (users.some(u => u.email === email)) {
        setAuthError("A user with this email already exists.");
        setAuthLoading(false);
        return;
      }
      const newUser = { email, password };
      users.push(newUser);
      localStorage.setItem("cc_users", JSON.stringify(users));
      // Auto-login after registration
      const u = { username: email.split("@")[0], email };
      setUser(u);
      localStorage.setItem("cc_user", JSON.stringify(u));
      setAuthModal(null);
      setAuthLoading(false);
    }, 700);
  }

  function handleModalBgClick(e) {
    if (e.target.classList.contains("hub-modal-bg")) {
      setAuthModal(null);
    }
  }

  // Handler for adding new event - moved here so it's always in scope when passed as a prop
  function handleAddEvent(event) {
    if (!user) return;
    setEvents((prev) => {
      const newEvents = [event, ...prev];
      setCached(CACHE_KEYS.events, newEvents);
      return newEvents;
    });
  }

  return (
    <Router>
      <div className="app hub-app">
        <HeaderBar />
        <Navbar
          user={user}
          onLogout={handleLogout}
          onShowLogin={handleShowLogin}
          onShowRegister={handleShowRegister}
        />
        {authModal && (
          <div
            className="hub-modal-bg"
            onClick={handleModalBgClick}
            tabIndex={-1}
            aria-modal="true"
            aria-busy={authLoading ? "true" : undefined}
          >
            <div className="hub-section-entrance">
              {authModal === "login" ? (
                <LoginForm
                  loading={authLoading}
                  error={authError}
                  onLogin={handleLogin}
                  onSwitchToRegister={() => {
                    setAuthModal("register");
                    setAuthError("");
                  }}
                  addRippleToButtons
                />
              ) : (
                <RegisterForm
                  loading={authLoading}
                  error={authError}
                  onRegister={handleRegister}
                  onSwitchToLogin={() => {
                    setAuthModal("login");
                    setAuthError("");
                  }}
                  addRippleToButtons
                />
              )}
            </div>
          </div>
        )}
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                news={news}
                weather={weather}
                events={events}
                contacts={contacts}
                newsError={newsError}
              />
            }
          />
          <Route
            path="/news"
            element={<NewsPage news={news} newsError={newsError} />}
          />
          <Route
            path="/weather"
            element={<WeatherPage weather={weather} />}
          />
          <Route
            path="/events"
            element={<EventsPage events={events} user={user} onAddEvent={handleAddEvent} />}
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
