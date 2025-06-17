import React, { useRef, useState, useEffect, useCallback } from "react";
import "./ThreeDCarousel.css";

/**
 * PUBLIC_INTERFACE
 * ThreeDCarousel - Classic horizontally sliding carousel component supporting arrows, indicators, and swipe.
 * Provides a smooth translateX-based slide transition for news/weather/event/community slides.
 * No 3D transforms or cylinder effect; all transitions move slides left/right in a classic slider manner.
 *
 * Props:
 *   - slides: array of element/slide objects (news, weather, event, banner, announcement, community)
 *   - autoRotate: ignored (manual only)
 *   - visibleSlideCount: optional, ignored (slides shown one at a time)
 */
function ThreeDCarousel({
  slides,
  autoRotate = false,
  visibleSlideCount = 1,
}) {
  // Get only slide objects, or render JSX if needed
  const carouselSlides = Array.isArray(slides)
    ? slides.map((s, i) => (React.isValidElement(s) ? s : renderRichSlide(s, i)))
    : [];
  const numSlides = carouselSlides.length;

  // Simple single-slide visibility mode
  const [active, setActive] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState(0); // +1 for right, -1 for left

  // Transition duration for slide (ms)
  const SLIDE_DURATION = 350;

  // Arrow/indicator handler
  function setActiveWithAnimation(newIndex, dir) {
    if (isAnimating || newIndex === active || numSlides <= 1) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setActive(newIndex);
      setIsAnimating(false);
    }, SLIDE_DURATION);
  }

  // Keyboard navigation
  function handleKeyDown(e) {
    if (isAnimating) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") {
      nextSlide();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      prevSlide();
    } else if (e.key === "Home") setActiveWithAnimation(0, -1);
    else if (e.key === "End") setActiveWithAnimation(numSlides - 1, +1);
  }

  // Next/Prev
  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setDirection(1);
    setIsAnimating(true);
    setTimeout(() => {
      setActive((prev) => (prev + 1) % numSlides);
      setIsAnimating(false);
    }, SLIDE_DURATION);
  }, [isAnimating, numSlides]);

  const prevSlide = useCallback(() => {
    if (isAnimating) return;
    setDirection(-1);
    setIsAnimating(true);
    setTimeout(() => {
      setActive((prev) => (prev - 1 + numSlides) % numSlides);
      setIsAnimating(false);
    }, SLIDE_DURATION);
  }, [isAnimating, numSlides]);

  // Touch/Swipe
  useCarouselSwipe(
    useRef(null),
    nextSlide,
    prevSlide,
    isAnimating,
    setIsAnimating,
    SLIDE_DURATION
  );

  // Accessible live msg
  const liveMsg =
    numSlides > 0
      ? `Slide ${active + 1} of ${numSlides}: ${getSlideLabel(carouselSlides[active])}`
      : "No slides";

  return (
    <div
      className="three-d-carousel"
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Core Features Carousel"
      style={{
        outline: "none",
        background: "linear-gradient(99deg, #181825 68%, #141426 100%)",
        filter: "drop-shadow(0 24px 99px #000e) brightness(1.03)",
        userSelect: "none",
      }}
      onKeyDown={handleKeyDown}
      aria-live="polite"
      data-carousel
    >
      <div className="carousel-slide-track-outer">
        <div
          className={`carousel-slide-track${isAnimating ? " animating" : ""}${direction === 1 ? " slide-left" : direction === -1 ? " slide-right" : ""}`}
          style={{
            transform: `translateX(${-active * 100}%)`,
            transition: isAnimating ? `transform ${SLIDE_DURATION}ms cubic-bezier(.59,.09,.27,1.02)` : 'none',
          }}
        >
          {carouselSlides.length === 0 && (
            <div className="carousel-slide active" style={{
              opacity: 1, zIndex: 9, filter: "none", pointerEvents: "auto",
              background: "linear-gradient(98deg, #232338 70%, #18182d 100%)",
              minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ color: "#fff", fontWeight: 600 }}>No slides to display.</span>
            </div>
          )}
          {carouselSlides.map((slide, i) => (
            <div
              className={`carousel-slide${i === active ? " active" : ""}`}
              key={i}
              aria-hidden={i !== active}
              tabIndex={i === active ? 0 : -1}
              style={{
                opacity: i === active ? 1 : 0.65,
                pointerEvents: i === active ? "auto" : "none",
                transition: 'opacity 0.4s',
              }}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
      <div className="carousel-controls">
        <button
          className="carousel-arrow left"
          title="Previous"
          aria-label="Previous Slide"
          tabIndex={0}
          onClick={() => { prevSlide(); }}
          disabled={isAnimating || numSlides < 2}
          style={{
            outline: isAnimating ? "none" : undefined,
            pointerEvents: isAnimating || numSlides < 2 ? "none" : "auto"
          }}
        >
          <span aria-hidden>‹</span>
        </button>
        <button
          className="carousel-arrow right"
          title="Next"
          aria-label="Next Slide"
          tabIndex={0}
          onClick={() => { nextSlide(); }}
          disabled={isAnimating || numSlides < 2}
          style={{
            outline: isAnimating ? "none" : undefined,
            pointerEvents: isAnimating || numSlides < 2 ? "none" : "auto"
          }}
        >
          <span aria-hidden>›</span>
        </button>
      </div>
      <div className="carousel-indicators" role="tablist" aria-label="Carousel indicators">
        {carouselSlides.map((_, i) => (
          <button
            key={i}
            className={`carousel-indicator${i === active ? " active" : ""}`}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
            tabIndex={0}
            onClick={() => {
              if (isAnimating || i === active) return;
              setActiveWithAnimation(i, i > active ? 1 : -1);
            }}
            disabled={isAnimating || i === active}
            role="tab"
            aria-selected={i === active}
            style={{
              outline: i === active ? "none" : undefined,
              pointerEvents: isAnimating || i === active ? "none" : "auto"
            }}
          />
        ))}
      </div>
      <div style={{
        height: 0,
        width: 0,
        overflow: "hidden",
        position: "absolute"
      }} aria-live="polite" aria-atomic="true">
        {liveMsg}
      </div>
    </div>
  );
}

// Render each slide type
function renderRichSlide(item, idx) {
  if (item.type === "news" || (item.title && item.url && !item.name)) {
    return (
      <div key={item.url || idx} style={{
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        background: "linear-gradient(95deg, #2f1308 63%, #531c00 110%)",
        boxShadow: "0 9px 34px #c800001c",
        borderRadius: 20,
        border: "2.5px solid #E87A41",
        minHeight: 180,
        padding: 16,
        position: "relative",
      }}>
        <span aria-label="news" style={{
          fontSize: 32,
          marginBottom: 8,
          color: "#E87A41",
          left: 20, top: 10,
          position: "absolute"
        }}>📰</span>
        {item.urlToImage && (
          <img
            src={item.urlToImage}
            alt=""
            style={{
              width: 68, height: 68, objectFit: "cover", borderRadius: 11,
              margin: "0 auto 8px auto", boxShadow: "0 7px 24px #0007",
              border: "2.5px solid #E87A41", background: "#292921"
            }}
            loading="lazy"
            aria-hidden="true"
          />
        )}
        <div style={{ fontWeight: 800, fontSize: "1.11rem", color: "#E87A41", marginBottom: 3 }}>{item.title}</div>
        <div style={{ fontSize: ".98rem", color: "#ffe5b6", marginBottom: 6, fontWeight: 410 }}>
          {item.description?.length > 130 ? (item.description.slice(0, 128) + "...") : item.description}
        </div>
        <div style={{ color: "#f5ddd4", fontSize: ".91em", marginBottom: 3 }}>
          {(item.source?.name ? item.source.name : "")}
          {item.publishedAt?.slice?.(0, 10) ? <>&nbsp;• {item.publishedAt.slice(0, 10)}</> : null}
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={0}
          style={{
            color: "#fff",
            textDecoration: "underline",
            fontWeight: 700,
            fontSize: "1em",
            background: "linear-gradient(90deg, #e87a41 70%, #c80000 110%)",
            boxShadow: "0 0 13px #c8000040",
            padding: "7px 18px",
            borderRadius: "11px",
            marginTop: 8,
            border: "none"
          }}
        >
          Read More
        </a>
      </div>
    );
  }
  if (item.type === "weather" || item.weathercode !== undefined || item.icon || (item.temperature !== undefined && item.city)) {
    const icon = getWeatherIcon(item);
    return (
      <div key={item.city || idx} style={{
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        background: "linear-gradient(100deg, #1d4b2c 74%, #164b24 110%)",
        boxShadow: "0 7px 32px #00960029",
        borderRadius: 20,
        border: "2.5px solid #009600",
        color: "#fff",
        minHeight: 150,
        position: "relative",
        padding: 14,
      }}>
        <span aria-label="weather" style={{
          fontSize: 39,
          marginBottom: 8,
          color: "#56ffa2",
          position: "absolute",
          left: 18,
          top: 10,
        }}>{icon}</span>
        <div style={{ fontWeight: 800, fontSize: "1.38rem", color: "#fff", marginBottom: 7, marginTop: 19 }}>
          {item.temperature != null ? `${item.temperature}°C` : "N/A"}
        </div>
        <div style={{ fontSize: "1.08em", color: "#bbffca", marginBottom: 7 }}>
          {item.weathercode !== undefined ? getWeatherDescription(item.weathercode) : ""}
        </div>
        <div style={{ color: "#93e39b", fontSize: ".97em", marginBottom: 6 }}>
          {item.city && item.country ? (<>{item.city}, {item.country}</>) : (item.city || "Chennai")}
        </div>
        <div style={{ color: "#e3ffe9", fontSize: ".96em", marginBottom: 7 }}>
          Winds: {item.windspeed ?? "N/A"} km/h
        </div>
        <a
          href="/weather"
          style={{
            color: "#262",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "1em",
            background: "linear-gradient(90deg, #21e682 74%, #009600 110%)",
            padding: "6px 14px",
            borderRadius: "9px",
            marginTop: 3,
            border: "none"
          }}
        >
          Full Forecast
        </a>
      </div>
    );
  }
  if (item.type === "announcement" || item.type === "community") {
    return (
      <div key={item.title || idx} style={{
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        background: "linear-gradient(93deg, #2d3360 60%, #0a1c38 120%)",
        border: "2.7px solid #fbe056",
        borderRadius: 22,
        boxShadow: "0 7px 32px 1px #fbe05633, 0 9px 42px #000c",
        minHeight: 110,
        padding: "26px 11px 17px 11px",
        color: "#ffe56b",
        position: "relative",
        fontFamily: "inherit"
      }}>
        <span aria-label="announcement" style={{
          fontSize: 38,
          color: "#ffe56b",
          marginBottom: 6,
          marginTop: -10,
          position: "absolute",
          left: 16,
          top: 10,
        }}>📣</span>
        <div style={{
          fontWeight: 800, fontSize: "1.11rem", marginBottom: 7, color: "#ffe56b", marginTop: 15, lineHeight: 1.18,
        }}>
          {item.title || "Community Announcement"}
        </div>
        {item.message && <div style={{
          color: "#fffde7",
          fontWeight: 410,
          marginBottom: 5,
          fontSize: ".99rem",
        }}>{item.message}</div>}
        {item.link && (
          <a
            href={item.link}
            target={item.link.startsWith("/") ? "_self" : "_blank"}
            rel={item.link.startsWith("/") ? undefined : "noopener noreferrer"}
            style={{
              color: "#2d3e80",
              background: "linear-gradient(90deg, #ffe56b 75%, #fffbe7 100%)",
              fontWeight: 800,
              padding: "6px 13px",
              borderRadius: 8,
              boxShadow: "0 0 12px #ffe56e54",
              marginTop: 6,
              textDecoration: "none"
            }}
          >Learn More</a>
        )}
      </div>
    );
  }
  if (item.type === "banner") {
    return (
      <div key={item.title || "banner" + idx} style={{
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        background: "linear-gradient(98deg, #0e0e1c 78%, #000 100%)",
        boxShadow: "0 24px 98px 2px #000a, 0 5px 30px #000, 0 5.5px 32px #fffbe771",
        border: "2.9px solid #fffbe7",
        borderRadius: 26,
        minHeight: 110,
        padding: "27px 10px 18px 10px",
        color: "#fffdfb",
        position: "relative",
        overflow: "hidden"
      }}>
        {item.icon && <span aria-label="banner-icon" style={{
          fontSize: 36,
          color: "#fffbe7",
          position: "absolute",
          left: 18,
          top: 13,
        }}>{item.icon}</span>}
        <div style={{
          fontWeight: 900,
          fontSize: "1.18rem",
          marginBottom: 9,
          color: "#fffbe7",
          marginTop: 17,
        }}>
          {item.title}
        </div>
        <div style={{
          color: "#fff",
          fontWeight: 520,
          fontSize: ".99rem",
          marginBottom: 5
        }}>{item.message}</div>
        {item.link && (
          <a
            href={item.link}
            target={item.link.startsWith("/") ? "_self" : "_blank"}
            rel={item.link.startsWith("/") ? undefined : "noopener noreferrer"}
            style={{
              color: "#000",
              background: "linear-gradient(90deg, #fffbe7 87%, #fff7cb 100%)",
              fontWeight: 760,
              borderRadius: 8,
              padding: "6px 18px",
              textDecoration: "none",
              marginTop: 4,
              fontSize: ".99rem"
            }}
          >{item.cta || "See Details"}</a>
        )}
      </div>
    );
  }
  if (item.type === "event" || (item.name && item.date && item.location)) {
    return (
      <div key={item.name || idx} style={{
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        background: "linear-gradient(95deg, #1b3417 62%, #0a221a 110%)",
        boxShadow: "0 7px 40px #18bd2c23",
        borderRadius: 20,
        border: "2.5px solid #18bd2c",
        minHeight: 135,
        padding: 14,
        position: "relative",
      }}>
        <span aria-label="event" style={{
          fontSize: 30,
          marginBottom: 6,
          color: "#18bd2c",
          position: "absolute",
          left: 17,
          top: 10,
        }}>🎉</span>
        <div style={{ fontWeight: 750, fontSize: "1.03rem", color: "#18bd2c", marginBottom: 5, marginTop: 15 }}>
          {item.name}
        </div>
        <div style={{ fontSize: ".98em", color: "#c2ffe0", fontWeight: 500, marginBottom: 4 }}>
          <span role="img" aria-label="calendar">📅</span>&nbsp;{item.date}
        </div>
        <div style={{ fontSize: ".94em", color: "#fff", marginBottom: 6 }}>
          <span role="img" aria-label="map">📍</span>&nbsp;{item.location}
        </div>
        {item.description && (
          <div style={{ color: "#bfffcf", marginBottom: 6, fontSize: ".96em" }}>
            {item.description.length > 80 ? (item.description.slice(0, 80) + "...") : item.description}
          </div>
        )}
        <a
          href="/events"
          style={{
            color: "#14df86",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "1em",
            background: "linear-gradient(90deg, #0eebb8 66%, #18bd2c 100%)",
            padding: "5px 12px",
            borderRadius: "8px",
            marginTop: 7,
            border: "none"
          }}
        >
          More Events
        </a>
      </div>
    );
  }
  // Fallback basic slide
  return (
    <div style={{ color: "#fff", textAlign: "center", padding: 20 }} key={idx}>
      {item.title || item.name || item.message || "Untitled"}
    </div>
  );
}

// Select emoji/icon for weather slide by icon code or weather code
function getWeatherIcon(item) {
  if (item.icon) {
    if (/01d/.test(item.icon)) return "☀️";
    if (/01n/.test(item.icon)) return "🌙";
    if (/02|03|04/.test(item.icon)) return "⛅";
    if (/09|10/.test(item.icon)) return "🌧️";
    if (/11/.test(item.icon)) return "⛈️";
    if (/13/.test(item.icon)) return "❄️";
    if (/50/.test(item.icon)) return "🌫️";
  }
  const code = item.weathercode;
  if (code !== undefined) {
    if ([0].includes(code)) return "☀️";
    if ([1, 2, 3].includes(code)) return "⛅";
    if ([45, 48].includes(code)) return "🌫️";
    if ([61, 63, 65, 66, 67].includes(code)) return "🌧️";
    if ([95, 96, 99].includes(code)) return "⛈️";
    if ([80, 81, 82].includes(code)) return "🌦️";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  }
  return "🌦️";
}

// Weather code -> description mapping
function getWeatherDescription(code) {
  if ([0].includes(code)) return "Clear Sky";
  if ([1, 2, 3].includes(code)) return "Partly Cloudy";
  if ([45, 48].includes(code)) return "Fog/Mist";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "";
}

// Human-friendly label for slide (for aria-live)
function getSlideLabel(slide) {
  if (!slide || typeof slide === "string") return slide || "";
  if (slide.props && slide.props.title)
    return slide.props.title;
  if (slide.props && typeof slide.props.children === "string")
    return slide.props.children;
  return "";
}

/**
 * Touch/swipe navigation hook for classic slider (left/right).
 */
function useCarouselSwipe(
  ref,
  next,
  prev,
  isAnimating,
  setIsAnimating,
  duration
) {
  const containerRef = React.useRef();
  useEffect(() => {
    const container = containerRef.current;
    let startX = null, lastX = null, delta = null, started = false;

    function handleTouchStart(e) {
      if (isAnimating || !e.touches || e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      lastX = startX;
      started = true;
    }
    function handleTouchMove(e) {
      if (!started || startX === null) return;
      lastX = e.touches[0].clientX;
    }
    function handleTouchEnd() {
      if (!started || startX === null || lastX == null) return;
      delta = lastX - startX;
      if (Math.abs(delta) > 37) {
        if (delta < 0) next();
        else prev();
        setIsAnimating && setIsAnimating(true);
      }
      startX = lastX = delta = null;
      started = false;
    }
    if (container) {
      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      container.addEventListener("touchmove", handleTouchMove, { passive: true });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [next, prev, isAnimating, setIsAnimating, duration]);
  // attach ref if supplied (otherwise create hidden root)
  if (ref && ref.current === null) ref.current = containerRef.current;
  return containerRef;
}

// PUBLIC_INTERFACE
export default ThreeDCarousel;
