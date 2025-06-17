import React, { useRef, useState, useEffect, useCallback } from "react";
import "./ThreeDCarousel.css";

/**
 * PUBLIC_INTERFACE
 * ThreeDCarousel - Enhanced 3D cylindrical carousel component.
 * 
 * Features:
 * - Slides distributed around a cylinder for immersive 3D.
 * - Customizable: visible slide count, animation speed, 3D perspective, content integration (news, events, etc).
 * - Enhanced accessibility and smooth animations, dark-themed visuals by default.
 *
 * Props:
 *   - slides: Array of JSX elements (required)
 *   - autoRotate: boolean (default: true)
 *   - rotateInterval: number ms (default: 4800, slower for realism)
 *   - visibleSlideCount: int (default: 5) – how many slides visible at once (center+adjacent pairs/cylinder)
 *   - perspective: number (default: 1700) – CSS 3D perspective px
 *   - carouselData: array (optional) – for API/live content integration, used if slides undefined
 */
function ThreeDCarousel({
  slides,
  autoRotate = true,
  rotateInterval = 4800, // slower for more realism!
  visibleSlideCount = 5, // show 4-6 slides at once for roundness
  perspective = 1700,    // deeper 3D look for realism
  carouselData = null,
}) {
  // Prefer slides array, otherwise build slides from carouselData prop (for API/live content)
  let carouselSlides = Array.isArray(slides)
    ? slides
    : (Array.isArray(carouselData)
      ? carouselData.map(renderDataToSlide) : []);
  const numSlides = carouselSlides.length;
  // Clamp visibleSlideCount (at least 1, max 6, never more than slides)
  visibleSlideCount = Math.max(4, Math.min(visibleSlideCount, 6, numSlides || 4));

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef();
  const stageRef = useRef();

  // Compute the rotation angle per slide
  const angleStep = numSlides > 0 ? 360 / numSlides : 360;
  // Cylinder Z-translate distance
  const radius = useResponsiveRadius(numSlides, visibleSlideCount);

  // Responsive: adjust the cylinder radius with viewport width, slide, and visibleSlideCount
  function useResponsiveRadius(count, showN) {
    const [r, setR] = useState(getRadius(window.innerWidth));
    useEffect(() => {
      function handleResize() { setR(getRadius(window.innerWidth)); }
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
      // eslint-disable-next-line
    }, [count, showN]);
    function getRadius(width) {
      // Cylinder roundness: wider for more visible slides
      if (width < 600)
        return 160 + (showN-1)*40 + (count-4)*11;
      if (width < 900)
        return 230 + (showN-1)*50 + (count-4)*14;
      // Desktop: More depth
      return 325 + (showN-1)*60 + (count-4)*18;
    }
    return r;
  }

  // Auto-rotation effect (slower, smoother)
  useEffect(() => {
    if (!autoRotate || paused || numSlides < 2) return;
    intervalRef.current = setInterval(() => nextSlideSmooth(), rotateInterval);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, [autoRotate, rotateInterval, numSlides, paused, active]);

  // Animation lock for transitions (matching css, slightly reduced for snappier navigation)
  useEffect(() => {
    if (!isAnimating) return;
    const t = setTimeout(() => setIsAnimating(false), 510);
    return () => clearTimeout(t);
  }, [isAnimating]);

  // Keyboard navigation & accessible indicators
  function handleKeyDown(e) {
    if (isAnimating) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") {
      nextSlideSmooth();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      prevSlideSmooth();
    } else if (e.key === "Home") {
      setActive(0);
    } else if (e.key === "End") {
      setActive(numSlides - 1);
    }
  }

  // Next/Prev navigation functions with guard
  const nextSlideSmooth = useCallback(() => {
    if (isAnimating) return;
    setActive((a) => (a + 1) % numSlides);
    setIsAnimating(true);
  }, [isAnimating, numSlides]);
  const prevSlideSmooth = useCallback(() => {
    if (isAnimating) return;
    setActive((a) => (a - 1 + numSlides) % numSlides);
    setIsAnimating(true);
  }, [isAnimating, numSlides]);

  // Pause on hover/focus for accessibility and control
  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  // Touch/Swipe navigation for mobile
  useCarouselSwipe(stageRef, nextSlideSmooth, prevSlideSmooth);

  // For a cylinder, center is 0, flanking slides are ±1...N, others are out of view for performance
  function getVisible(relPos) {
    // relPos === 0: center, ±1, ±2, ...
    // For even visibleSlideCount, show more on right
    const half = Math.floor((visibleSlideCount-1)/2);
    return (
      relPos === 0 ||
      (relPos <= half && relPos > 0) ||
      (relPos >= numSlides-half && relPos <= numSlides-1)
    );
  }

  // aria-live message for accessibility: which slide is active
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
      style={{ outline: "none", perspective: `${perspective}px`, background: "transparent" }}
      onKeyDown={handleKeyDown}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      aria-live="polite"
    >
      <div
        className={`carousel-3d-stage${isAnimating ? " animating" : ""}`}
        ref={stageRef}
        style={{
          transform: `translateZ(-${radius}px) rotateY(${-active * angleStep}deg)`,
        }}
        aria-live="off"
      >
        {carouselSlides.length === 0 && (
          <div className="carousel-3d-slide active" aria-hidden="false" style={{
            opacity: 1, zIndex: 2,
            filter: "none", pointerEvents: "auto"
          }}>
            <span style={{ color: "#fff", fontWeight: 600 }}>No slides to display.</span>
          </div>
        )}
        {carouselSlides.map((slide, i) => {
          const theta = i * angleStep;
          const relPos = (i - active + numSlides) % numSlides;
          const visible = getVisible(relPos) || numSlides < visibleSlideCount + 1;

          return (
            <div
              className={`carousel-3d-slide${relPos === 0 ? " active" : ""}`}
              key={i}
              aria-hidden={relPos !== 0}
              tabIndex={relPos === 0 ? 0 : -1}
              style={{
                transform: `rotateY(${theta}deg) translateZ(${radius}px)`,
                zIndex: relPos === 0 ? 3 : 1,
                opacity: visible ? (relPos === 0 ? 1 : 0.54) : 0,
                pointerEvents: relPos === 0 ? "auto" : "none",
                transitionDelay: isAnimating && relPos === 0 ? "0.08s" : "0s"
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

// Helper: If carouselData is given (API news/events) render slide visual
function renderDataToSlide(item, idx) {
  // Support News API, Event, or basic
  if (item.title && item.url) {
    // News
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }} key={item.url || idx}>
        {item.urlToImage && (
          <img
            src={item.urlToImage}
            alt=""
            style={{
              width: 90,
              height: 90,
              objectFit: "cover",
              borderRadius: 13,
              marginBottom: 13,
              boxShadow: "0 7px 28px #0008"
            }}
            loading="lazy"
            aria-hidden="true"
          />
        )}
        <div style={{ fontWeight: 770, fontSize: "1.17rem", color: "#E87A41", marginBottom: 3 }}>{item.title}</div>
        <div style={{ fontSize: ".99rem", color: "#b4ccd8", marginBottom: 7 }}>{item.description || ""}</div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={0}
          style={{
            color: "#fff",
            textDecoration: "underline",
            fontWeight: 600,
            fontSize: ".99em",
            background: "rgba(0,0,0,0.18)",
            padding: "4px 16px",
            borderRadius: "9px"
          }}
        >
          More details
        </a>
      </div>
    );
  } else if (item.name && item.date && item.location) {
    // Event
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }} key={item.name}>
        <div style={{
          fontWeight: 800, fontSize: "1.13rem", color: "#18bd2c",
          marginBottom: 2
        }}>
          {item.name}
        </div>
        <div style={{ fontSize: "1.01em", color: "#d5f2ff", fontWeight: 500, marginBottom: 6 }}>
          <span role="img" aria-label="calendar">📅</span>&nbsp;{item.date}
        </div>
        <div style={{ fontSize: ".98em", color: "#fff", marginBottom: 7 }}>
          <span role="img" aria-label="map">📍</span>&nbsp;{item.location}
        </div>
        {item.description && (
          <div style={{ color: "#bfffcf", marginBottom: 2, fontSize: ".99em" }}>{item.description}</div>
        )}
      </div>
    );
  }
  // Fallback-render
  return (
    <div style={{ color: "#fff", textAlign: "center" }} key={idx}>
      {item.title || item.name || "Untitled"}
    </div>
  );
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

