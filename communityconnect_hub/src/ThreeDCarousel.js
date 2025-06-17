import React, { useRef, useState, useEffect, useCallback } from "react";
import "./ThreeDCarousel.css";

/**
 * PUBLIC_INTERFACE
 * ThreeDCarousel - Enhanced 3D cylindrical carousel component with visually rich, section-themed slides for News, Weather, and Events.
 * Slides automatically render with section-specific icons, images, backgrounds, and layouts.
 *
 * Props:
 *   - slides: Array of JSX elements (overrides carouselData, auto-rendered as slides if not present)
 *   - carouselData: array of slide objects ({type: "news"|"weather"|"event", ...}) for dynamic content
 *   - autoRotate, rotateInterval, visibleSlideCount, perspective: carousel controls
 */
function ThreeDCarousel({
  slides,
  autoRotate = true,
  rotateInterval = 4000,
  visibleSlideCount = 5,
  perspective = 1650,
  carouselData = null
}) {
  // Prefer explicit slides, else create slides from carouselData array using custom renderer
  let carouselSlides = Array.isArray(slides)
    ? slides
    : (Array.isArray(carouselData) ? carouselData.map((item, idx) => renderRichSlide(item, idx)) : []);
  const numSlides = carouselSlides.length;

  // Clamp visible slide count for 3D effect accuracy (min 4, max 6, odd preferred)
  visibleSlideCount = Math.max(4, Math.min(visibleSlideCount, Math.min(6, numSlides > 0 ? numSlides : 4)));
  if (numSlides > 4 && visibleSlideCount % 2 === 0) visibleSlideCount--;

  // Carousel state management
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef();
  const stageRef = useRef();

  // Calculate rotation step and radius (responsive to device width)
  const angleStep = numSlides > 0 ? 360 / numSlides : 360;

  function useResponsiveRadius(count, visCount) {
    const [r, setR] = useState(calcRadius(window.innerWidth));
    useEffect(() => {
      function handleResize() { setR(calcRadius(window.innerWidth)); }
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [count, visCount]);
    function calcRadius(width) {
      if (width < 520) return 110 + (visCount - 1) * 35 + (count - 4) * 5;
      if (width < 950) return 190 + (visCount - 1) * 54 + (count - 4) * 14;
      return 390 + (visCount - 1) * 77 + (count - 4) * 20;
    }
    return r;
  }
  const radius = useResponsiveRadius(numSlides, visibleSlideCount);

  // Auto-rotation logic
  useEffect(() => {
    if (!autoRotate || paused || numSlides < 2) return;
    intervalRef.current = setInterval(() => nextSlideSmooth(), rotateInterval);
    return () => clearInterval(intervalRef.current);
  }, [autoRotate, rotateInterval, numSlides, paused, active]);

  useEffect(() => {
    if (!isAnimating) return;
    const t = setTimeout(() => setIsAnimating(false), 700);
    return () => clearTimeout(t);
  }, [isAnimating]);

  // Accessibility: Keyboard navigation
  function handleKeyDown(e) {
    if (isAnimating) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") nextSlideSmooth();
    else if (e.key === "ArrowLeft" || e.key === "PageUp") prevSlideSmooth();
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(numSlides - 1);
  }

  // PUBLIC_INTERFACE
  const nextSlideSmooth = useCallback(() => {
    if (isAnimating) return;
    setActive(a => (a + 1) % numSlides);
    setIsAnimating(true);
  }, [isAnimating, numSlides]);

  // PUBLIC_INTERFACE
  const prevSlideSmooth = useCallback(() => {
    if (isAnimating) return;
    setActive(a => (a - 1 + numSlides) % numSlides);
    setIsAnimating(true);
  }, [isAnimating, numSlides]);

  // Pause carousel on hover/focus, resume on leave/blur
  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  // Swipe support stub (mobile)
  useCarouselSwipe(stageRef, nextSlideSmooth, prevSlideSmooth);

  // Show the visible window of slides for 3D effect
  function getVisible(relPos) {
    if (numSlides <= visibleSlideCount) return true;
    let half = Math.floor(visibleSlideCount / 2);
    return (
      relPos === 0 ||
      relPos <= half ||
      relPos >= numSlides - half
    );
  }

  function getStyle(relPos) {
    if (relPos === 0)
      return { opacity: 1, zIndex: 10, filter: "none", pointerEvents: "auto" };
    const half = Math.floor(visibleSlideCount / 2);
    if ((relPos <= half && relPos !== 0) || (relPos > numSlides - half && relPos < numSlides)) {
      return { opacity: 0.54, filter: "blur(5px) grayscale(0.55)", zIndex: 3, pointerEvents: "none" };
    }
    return { opacity: 0.18, filter: "blur(11px) grayscale(0.85) brightness(0.85)", zIndex: 1, pointerEvents: "none" };
  }

  // Accessible slide description
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
        perspective: `${perspective}px`,
        background: "linear-gradient(99deg, #181825 68%, #141426 100%)",
        filter: "drop-shadow(0 24px 99px #000e) brightness(1.03)"
      }}
      onKeyDown={handleKeyDown}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      aria-live="polite"
      data-3d-carousel
    >
      <div
        className={`carousel-3d-stage${isAnimating ? " animating" : ""}`}
        ref={stageRef}
        style={{
          transform: `translateZ(-${radius}px) rotateY(${-active * angleStep}deg)`
        }}
        aria-live="off"
      >
        {carouselSlides.length === 0 && (
          <div className="carousel-3d-slide active" aria-hidden="false"
            style={{
              opacity: 1, zIndex: 9, filter: "none", pointerEvents: "auto",
              background: "linear-gradient(98deg, #232338 70%, #18182d 100%)"
            }}>
            <span style={{ color: "#fff", fontWeight: 600 }}>No slides to display.</span>
          </div>
        )}
        {carouselSlides.map((slide, i) => {
          const theta = i * angleStep;
          const relPos = (i - active + numSlides) % numSlides;
          if (!getVisible(relPos)) return null;
          return (
            <div
              className={`carousel-3d-slide${relPos === 0 ? " active" : ""}`}
              key={i}
              aria-hidden={relPos !== 0}
              tabIndex={relPos === 0 ? 0 : -1}
              style={{
                transform: `rotateY(${theta}deg) translateZ(${radius}px)`,
                transitionDelay: isAnimating && relPos === 0 ? "0.04s" : "0s",
                ...getStyle(relPos)
              }}
            >
              {slide}
            </div>
          );
        })}
      </div>
      <div className="carousel-3d-controls">
        <button
          className="carousel-3d-arrow left"
          title="Previous"
          aria-label="Previous Slide"
          tabIndex={0}
          onClick={prevSlideSmooth}
          disabled={isAnimating || numSlides < 2}
        >
          <span aria-hidden>‹</span>
        </button>
        <button
          className="carousel-3d-arrow right"
          title="Next"
          aria-label="Next Slide"
          tabIndex={0}
          onClick={nextSlideSmooth}
          disabled={isAnimating || numSlides < 2}
        >
          <span aria-hidden>›</span>
        </button>
      </div>
      <div className="carousel-3d-indicators" role="tablist" aria-label="Carousel indicators">
        {carouselSlides.map((_, i) => (
          <button
            key={i}
            className={`carousel-3d-indicator${i === active ? " active" : ""}`}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
            tabIndex={0}
            onClick={() => !isAnimating && setActive(i)}
            disabled={isAnimating || i === active}
            role="tab"
            aria-selected={i === active}
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

/**
 * Render three visually rich slide types for the carousel: News, Weather, and Events.
 * Each uses themed background color, summary/details, icons, and images.
 */
function renderRichSlide(item, idx) {
  // News slide: Article image, news icon, summary, colored background
  if (item.type === "news" || (item.title && item.url && !item.name)) {
    return (
      <div
        key={item.url || idx}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: "linear-gradient(95deg, #2f1308 63%, #531c00 110%)",
          boxShadow: "0 9px 34px #c800001c",
          borderRadius: 20,
          border: "2.5px solid #E87A41",
          minHeight: 240,
          padding: 22,
          position: "relative",
        }}
      >
        <span aria-label="news" style={{
          fontSize: 37,
          marginBottom: 12,
          color: "#E87A41",
          position: "absolute",
          left: 20,
          top: 10,
          filter: "drop-shadow(0 2px 10px #c8000077)"
        }}>📰</span>

        {item.urlToImage && (
          <img
            src={item.urlToImage}
            alt=""
            style={{
              width: 84,
              height: 84,
              objectFit: "cover",
              borderRadius: 11,
              margin: "0 auto 13px auto",
              boxShadow: "0 7px 24px #0007",
              border: "2.5px solid #E87A41",
              background: "#292921"
            }}
            loading="lazy"
            aria-hidden="true"
          />
        )}
        <div style={{ fontWeight: 820, fontSize: "1.11rem", color: "#E87A41", marginBottom: 3 }}>{item.title}</div>
        <div style={{ fontSize: ".98rem", color: "#ffe5b6", marginBottom: 7, fontWeight: 410 }}>
          {item.description?.length > 130 ? (item.description.slice(0, 128) + "...") : item.description}
        </div>
        <div style={{ color: "#f5ddd4", fontSize: ".91em", marginBottom: 3 }}>
          {(item.source?.name ? item.source.name : "")}
          {item.publishedAt?.slice?.(0,10) ? <>&nbsp;<span style={{ color: "#ffd7b4" }}>•</span> {item.publishedAt.slice(0,10)}</> : null}
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
            padding: "8px 22px",
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
  // Weather slide: Emoji icon, description, metrics, styled background
  if (item.type === "weather" || item.weathercode !== undefined || item.icon || (item.temperature !== undefined && item.city)) {
    const icon = getWeatherIcon(item);
    return (
      <div
        key={item.city || idx}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: "linear-gradient(100deg, #1d4b2c 74%, #164b24 110%)",
          boxShadow: "0 7px 32px #00960029",
          borderRadius: 20,
          border: "2.5px solid #009600",
          color: "#fff",
          minHeight: 200,
          position: "relative",
          padding: 20,
        }}
      >
        <span aria-label="weather" style={{
          fontSize: 48,
          marginBottom: 16,
          color: "#56ffa2",
          position: "absolute",
          left: 20,
          top: 10,
          filter: "drop-shadow(0 2px 13px #00c97c66)"
        }}>{icon}</span>
        <div style={{ fontWeight: 820, fontSize: "2.05rem", color: "#fff", marginBottom: 8, marginTop: 20 }}>
          {item.temperature != null ? `${item.temperature}°C` : "N/A"}
        </div>
        <div style={{ fontSize: "1.15em", color: "#bbffca", marginBottom: 7 }}>
          {item.weathercode !== undefined ? getWeatherDescription(item.weathercode) : ""}
        </div>
        <div style={{ color: "#93e39b", fontSize: ".97em", marginBottom: 7 }}>
          {item.city && item.country ? (<>{item.city}, {item.country}</>) : (item.city || "Chennai")}
        </div>
        <div style={{ color: "#e3ffe9", fontSize: ".96em", marginBottom: 9 }}>
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
            padding: "8px 24px",
            borderRadius: "10px",
            marginTop: 4,
            border: "none"
          }}
        >
          Full Forecast
        </a>
      </div>
    );
  }
  // Event slide: Event title, date/time, summary, icon, colored background
  if (item.type === "event" || (item.name && item.date && item.location)) {
    return (
      <div
        key={item.name || idx}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: "linear-gradient(95deg, #1b3417 62%, #0a221a 110%)",
          boxShadow: "0 7px 40px #18bd2c23",
          borderRadius: 20,
          border: "2.5px solid #18bd2c",
          minHeight: 175,
          padding: 20,
          position: "relative",
        }}
      >
        <span aria-label="event" style={{
          fontSize: 40,
          marginBottom: 12,
          color: "#18bd2c",
          position: "absolute",
          left: 20,
          top: 10,
          filter: "drop-shadow(0 2px 11px #18bd2c99)"
        }}>🎉</span>
        <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "#18bd2c", marginBottom: 5, marginTop: 20 }}>
          {item.name}
        </div>
        <div style={{ fontSize: ".99em", color: "#c2ffe0", fontWeight: 500, marginBottom: 6 }}>
          <span role="img" aria-label="calendar">📅</span>&nbsp;{item.date}
        </div>
        <div style={{ fontSize: ".98em", color: "#fff", marginBottom: 7 }}>
          <span role="img" aria-label="map">📍</span>&nbsp;{item.location}
        </div>
        {item.description && (
          <div style={{ color: "#bfffcf", marginBottom: 7, fontSize: ".98em" }}>
            {item.description.length > 110 ? (item.description.slice(0, 110) + "...") : item.description}
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
            padding: "7px 20px",
            borderRadius: "10px",
            marginTop: 8,
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
    <div style={{ color: "#fff", textAlign: "center", padding: 30 }} key={idx}>
      {item.title || item.name || item.message || "Untitled"}
    </div>
  );
}

/**
 * Select emoji/icon for weather slide by icon code or weather code.
 */
function getWeatherIcon(item) {
  // OpenWeatherMap icon codes
  if (item.icon) {
    if (/01d/.test(item.icon)) return "☀️";
    if (/01n/.test(item.icon)) return "🌙";
    if (/02|03|04/.test(item.icon)) return "⛅";
    if (/09|10/.test(item.icon)) return "🌧️";
    if (/11/.test(item.icon)) return "⛈️";
    if (/13/.test(item.icon)) return "❄️";
    if (/50/.test(item.icon)) return "🌫️";
  }
  // Weather code fallback
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

// Try to extract human-friendly label for a slide (for aria-live)
function getSlideLabel(slide) {
  if (!slide || typeof slide === "string") return slide || "";
  if (slide.props && slide.props.title)
    return slide.props.title;
  // Try to access string child in rich JSX
  if (slide.props && typeof slide.props.children === "string")
    return slide.props.children;
  return "";
}

// Dummy/stub touch-swipe hook for compatibility (can be expanded for real mobile swipe in future)
function useCarouselSwipe(ref, next, prev) { }

// PUBLIC_INTERFACE
export default ThreeDCarousel;

