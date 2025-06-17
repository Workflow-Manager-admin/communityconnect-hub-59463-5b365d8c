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

