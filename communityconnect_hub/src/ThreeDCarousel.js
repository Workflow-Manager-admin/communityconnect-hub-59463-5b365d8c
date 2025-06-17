import React, { useRef, useState, useEffect, useCallback } from "react";
import "./ThreeDCarousel.css";

/**
 * PUBLIC_INTERFACE
 * ThreeDCarousel - Enhanced 3D cylindrical carousel component with dynamic API content support,
 * optimized animation, dark theme, and clear cylinder realism.
 *
 * Features:
 * - 3D cylindrical arrangement of slides, visually immersive cylinder effect
 * - Tuned: visible slide count, animation speed, strong 3D perspective, smooth transitions
 * - Supports dynamic API slides (live news/events), with fallback to standard slides
 * - Maintains dark theme visual consistency
 *
 * Props:
 *   - slides: Array of JSX elements (priority if present)
 *   - autoRotate: boolean (default: true)
 *   - rotateInterval: ms (default: 4000, smooth and not too fast/slow)
 *   - visibleSlideCount: int (default: 5, min 4, max 6)
 *   - perspective: px (default: 1650) – controls CSS perspective for cylinder "reach"
 *   - carouselData: array (optional) – dynamic API/news/events to render as slides if slides undefined
 */
function ThreeDCarousel({
  slides,
  autoRotate = true,
  rotateInterval = 4000, // slightly slower, optimal for realism
  visibleSlideCount = 5,
  perspective = 1650, // realistic depth for 3D, still comfortable for most screens
  carouselData = null
}) {
  // Use slides array or, if undefined, convert carouselData (API output) to slides
  let carouselSlides = Array.isArray(slides)
    ? slides
    : (Array.isArray(carouselData) ? carouselData.map(renderDataToSlide) : []);
  const numSlides = carouselSlides.length;

  // Clamp slide count to realistic/meaningful window (4-6 for cylinder), don't exceed slide count
  visibleSlideCount = Math.max(4, Math.min(visibleSlideCount, Math.min(6, numSlides > 0 ? numSlides : 4)));
  if (numSlides > 4 && visibleSlideCount % 2 === 0) visibleSlideCount--; // always odd for symmetry

  // State and essential refs
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef();
  const stageRef = useRef();

  // 3D angle per slide and adaptive radius for proper spread at all device widths
  const angleStep = numSlides > 0 ? 360 / numSlides : 360;

  // Responsive radius for realistic cylinder shape
  function useResponsiveRadius(count, visCount) {
    const [r, setR] = useState(calcRadius(window.innerWidth));
    useEffect(() => {
      function handleResize() { setR(calcRadius(window.innerWidth)); }
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [count, visCount]);
    function calcRadius(width) {
      // Desktop: wide spread, small screens: compact
      if (width < 520) return 110 + (visCount - 1) * 35 + (count - 4) * 5;
      if (width < 950) return 190 + (visCount - 1) * 54 + (count - 4) * 14;
      return 390 + (visCount - 1) * 77 + (count - 4) * 20;
    }
    return r;
  }
  const radius = useResponsiveRadius(numSlides, visibleSlideCount);

  // Animation speed tuning and smoothness
  useEffect(() => {
    if (!autoRotate || paused || numSlides < 2) return;
    intervalRef.current = setInterval(() => nextSlideSmooth(), rotateInterval);
    return () => clearInterval(intervalRef.current);
  }, [autoRotate, rotateInterval, numSlides, paused, active]);

  useEffect(() => {
    if (!isAnimating) return;
    // Match CSS anim time (was .66s), slight buffer for smoothness
    const t = setTimeout(() => setIsAnimating(false), 700);
    return () => clearTimeout(t);
  }, [isAnimating]);

  // Accessibility/keyboard navigation
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

  // Pause on hover/focus for deliberate navigation
  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  // Enable swipe gesture support (stub for now)
  useCarouselSwipe(stageRef, nextSlideSmooth, prevSlideSmooth);

  // Show N visible slides: center and adjacent according to count
  function getVisible(relPos) {
    if (numSlides <= visibleSlideCount) return true;
    // Wraps for cylinder illusion
    let half = Math.floor(visibleSlideCount / 2);
    return (
      relPos === 0 ||
      relPos <= half ||
      relPos >= numSlides - half
    );
  }

  // Custom style: tune opacity/blur for center, side, far slides
  function getStyle(relPos) {
    // Center active slide
    if (relPos === 0)
      return { opacity: 1, zIndex: 10, filter: "none", pointerEvents: "auto" };
    const half = Math.floor(visibleSlideCount / 2);
    if ((relPos <= half && relPos !== 0) || (relPos > numSlides - half && relPos < numSlides)) {
      // Sides
      return { opacity: 0.54, filter: "blur(5px) grayscale(0.55)", zIndex: 3, pointerEvents: "none" };
    }
    // Farther sides (phantom)
    return { opacity: 0.18, filter: "blur(11px) grayscale(0.85) brightness(0.85)", zIndex: 1, pointerEvents: "none" };
  }

  // aria-live preview for accessibility
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
 * Enhanced slide renderer for News, Weather, Events, Announcements, and Banners with section icons and color/style distinction.
 */
function renderDataToSlide(item, idx) {
  // News card slide
  if (item.type === "news" || (item.title && item.url && !item.name)) {
    return (
      <div
        key={item.url || idx}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background:
            "linear-gradient(98deg, #261800 62%, #1c1313 110%)",
          boxShadow: "0 7px 28px #c8000012",
          borderRadius: 19,
          border: "2.5px solid #E87A41",
          position: "relative",
          minHeight: 238,
          padding: 18,
        }}
      >
        <span aria-label="news" style={{fontSize: 37, marginBottom: 9, color: "#E87A41", position: "absolute", left: 23, top: 10}}>📰</span>
        {item.urlToImage && (
          <img
            src={item.urlToImage}
            alt=""
            style={{
              width: 80,
              height: 80,
              objectFit: "cover",
              borderRadius: 11,
              margin: "0 auto 9px auto",
              boxShadow: "0 7px 24px #0007",
              border: "2.5px solid #E87A41",
              background: "#292921"
            }}
            loading="lazy"
            aria-hidden="true"
          />
        )}
        <div style={{ fontWeight: 820, fontSize: "1.09rem", color: "#E87A41", marginBottom: 2, marginTop: 10 }}>{item.title}</div>
        <div style={{ fontSize: ".99rem", color: "#ffe5b6", marginBottom: 6, fontWeight: 410 }}>
          {item.description?.length > 120 ? (item.description.slice(0, 120) + "...") : item.description}
        </div>
        <div style={{ color: "#f5ddd4", fontSize: ".91em", marginBottom: 4 }}>
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
            padding: "6px 22px",
            borderRadius: "11px",
            marginTop: 7,
            border: "none"
          }}
        >
          Read More
        </a>
      </div>
    );
  }
  // Weather card slide
  if (item.type === "weather" || item.weathercode !== undefined || item.icon || (item.temperature !== undefined && item.city)) {
    // Use emoji/icon map for main weather code or id
    let icon = "🌦️";
    if (item.icon) {
      // OpenWeather format ("01d", etc.)
      if (/01d/.test(item.icon)) icon = "☀️";
      else if (/01n/.test(item.icon)) icon = "🌙";
      else if (/02|03|04/.test(item.icon)) icon = "⛅";
      else if (/09|10/.test(item.icon)) icon = "🌧️";
      else if (/11/.test(item.icon)) icon = "⛈️";
      else if (/13/.test(item.icon)) icon = "❄️";
      else if (/50/.test(item.icon)) icon = "🌫️";
    } else if (item.weathercode !== undefined) {
      const code = item.weathercode;
      if ([0].includes(code)) icon = "☀️";
      else if ([1, 2, 3].includes(code)) icon = "⛅";
      else if ([45, 48].includes(code)) icon = "🌫️";
      else if ([61, 63, 65, 66, 67].includes(code)) icon = "🌧️";
      else if ([95, 96, 99].includes(code)) icon = "⛈️";
      else if ([80, 81, 82].includes(code)) icon = "🌦️";
      else if ([71, 73, 75, 77, 85, 86].includes(code)) icon = "❄️";
    }
    return (
      <div
        key={item.city || idx}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: "linear-gradient(100deg, #143f2a 74%, #192d18 110%)",
          boxShadow: "0 7px 32px #00d1161a",
          borderRadius: 19,
          border: "2.5px solid #009600",
          color: "#fff",
          minHeight: 200,
          position: "relative",
          padding: 17,
        }}
      >
        <span aria-label="weather" style={{fontSize: 44, marginBottom: 13, color: "#49e188", position: "absolute", left: 23, top: 10}}>{icon}</span>
        <div style={{ fontWeight: 810, fontSize: "2.03rem", color: "#fff", marginBottom: 9, marginTop: 14 }}>{item.temperature != null ? `${item.temperature}°C` : "N/A"}</div>
        <div style={{ fontSize: "1.13em", color: "#bbffca", marginBottom: 6 }}>
          {item.weathercode !== undefined ? getWeatherDescription(item.weathercode) : ""}
        </div>
        <div style={{ color: "#93e39b", fontSize: ".97em", marginBottom: 7 }}>
          {item.city && item.country ? (<>{item.city}, {item.country}</>) : (item.city || "Chennai")}
        </div>
        <div style={{ color: "#e3ffe9", fontSize: ".96em", marginBottom: 8 }}>
          Winds: {item.windspeed ?? "N/A"} km/h
        </div>
        <a
          href="/weather"
          style={{
            color: "#262",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: ".99em",
            background: "linear-gradient(90deg, #21e682 70%, #009600 110%)",
            boxShadow: "0 0 15px #76ffe330",
            padding: "7px 23px",
            borderRadius: "11px",
            marginTop: 4,
            border: "none"
          }}
        >
          Full Forecast
        </a>
      </div>
    );
  }
  // Event card slide
  if (item.type === "event" || (item.name && item.date && item.location)) {
    return (
      <div
        key={item.name || idx}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: "linear-gradient(96deg, #1c331a 62%, #212121 110%)",
          boxShadow: "0 7px 28px #08ed0010",
          borderRadius: 19,
          border: "2.5px solid #18bd2c",
          minHeight: 180,
          padding: 17,
          position: "relative",
        }}
      >
        <span aria-label="event" style={{fontSize: 39, marginBottom: 9, color: "#18bd2c", position: "absolute", left: 23, top: 8}}>🎉</span>
        <div style={{ fontWeight: 800, fontSize: "1.18rem", color: "#18bd2c", marginBottom: 6, marginTop: 13 }}>
          {item.name}
        </div>
        <div style={{ fontSize: ".99em", color: "#c2ffe0", fontWeight: 500, marginBottom: 7 }}>
          <span role="img" aria-label="calendar">📅</span>&nbsp;{item.date}
        </div>
        <div style={{ fontSize: ".97em", color: "#fff", marginBottom: 7 }}>
          <span role="img" aria-label="map">📍</span>&nbsp;{item.location}
        </div>
        {item.description && (
          <div style={{ color: "#bfffcf", marginBottom: 7, fontSize: ".98em" }}>{item.description.length > 100 ? (item.description.slice(0, 100) + "...") : item.description}</div>
        )}
        <a
          href="/events"
          style={{
            color: "#14df86",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: ".97em",
            background: "linear-gradient(90deg, #0eebb8 66%, #18bd2c 100%)",
            boxShadow: "0 0 13px #00ee90ad",
            padding: "6px 20px",
            borderRadius: "10px",
            marginTop: 7,
            border: "none"
          }}
        >
          More Events
        </a>
      </div>
    );
  }
  // Community Announcement: Special slide card (example data: { type:"announcement", message:string, icon, color, link? })
  if (item.type === "announcement") {
    return (
      <div
        key={idx}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: item.color || "linear-gradient(85deg, #0d160d 0%, #203839 110%)",
          boxShadow: "0 7px 20px #00e0ca1c",
          borderRadius: 19,
          border: "2.5px solid #14cbd1",
          padding: 19,
          minHeight: 120,
          color: "#deffee",
          position: "relative",
        }}
      >
        <span aria-label="announcement" style={{fontSize: 37, marginBottom: 11, color: "#14cbd1"}}>{item.icon || "📢"}</span>
        <div style={{ fontWeight: 800, fontSize: "1.12rem", color: item.color || "#14cbd1", marginBottom: 6 }}>
          Community Announcement
        </div>
        <div style={{ fontSize: ".98em", color: "#fff", marginBottom: 7 }}>
          {item.message}
        </div>
        {item.link &&
          <a
            href={item.link}
            style={{
              color: "#15d7e8",
              textDecoration: "underline",
              fontWeight: 600,
              fontSize: ".98em",
              marginTop: 6,
              borderRadius: "10px",
              background: "rgba(20,203,209,0.1)",
              padding: "4px 15px"
            }}
            rel="noopener noreferrer"
            target="_blank"
          >
            Learn more
          </a>
        }
      </div>
    );
  }
  // Custom Banner: Simple visual banner (type:"banner", title, subtitle, icon)
  if (item.type === "banner") {
    return (
      <div
        key={idx}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: item.color || "linear-gradient(77deg, #1a175a 0%, #3d087c 98%)",
          border: `2.5px solid ${item.color || "#5b2ae6"}`,
          borderRadius: 19,
          padding: 19,
          minHeight: 104,
          color: "#e5e7ff",
          position: "relative",
        }}
      >
        {item.icon && (
          <span aria-label="banner" style={{fontSize: 42, marginBottom: 8, color: item.iconColor||"#e5e7ff"}}>{item.icon}</span>
        )}
        <div style={{ fontWeight: 830, fontSize: "1.22rem", color: item.titleColor || "#bdadff", marginBottom: 3 }}>
          {item.title}
        </div>
        {item.subtitle && (
          <div style={{ fontSize: ".97em", color: item.subtitleColor || "#dadbff", marginBottom: 6 }}>
            {item.subtitle}
          </div>
        )}
      </div>
    );
  }

  // Fallback to plain
  return (
    <div style={{ color: "#fff", textAlign: "center" }} key={idx}>
      {item.title || item.name || item.message || "Untitled"}
    </div>
  );
}

// Weather code -> description mapping (used for custom weather slide render)
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

// Helper: For accessibility – returns short label for slide
function getSlideLabel(slide) {
  if (!slide || typeof slide === "string") return slide;
  // Try to extract the slide "label" (title prop or direct innerText of JSX)
  if (slide.props && slide.props.title)
    return slide.props.title;
  if (slide.props && typeof slide.props.children === "string")
    return slide.props.children;
  // Otherwise fallback to empty
  return "";
}

/**
 * Dummy touch/swipe hook for linter compatibility.
 * To enable mobile swipe: implement a basic left/right swipe detector.
 */
function useCarouselSwipe(ref, next, prev) {
  // No-op for now; linter fix
}

export default ThreeDCarousel;

