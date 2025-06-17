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
  // Adjusted: slightly faster default speed for more dynamic carousel (still smooth)
  rotateInterval = 4100,
  // Adjust visible slides to a more cylindrical effect: 6 looks best for full round (fallback to max content)
  visibleSlideCount = 6,
  // Adjusted perspective for more pronounced 3D cylinder (vertical stacking is improved with ~1450)
  perspective = 1450,
  carouselData = null,
}) {
  // Prefer "slides", but if not provided use "carouselData" (from APIs: news, events, weather)
  let carouselSlides = Array.isArray(slides)
    ? slides
    : (Array.isArray(carouselData)
      ? carouselData.map(renderDataToSlide) : []);
  const numSlides = carouselSlides.length;

  // Clamp: show at least 4 but maximum 6, but never more than slides available (keep cylinder realistic)
  visibleSlideCount = Math.max(4, Math.min(visibleSlideCount, 6, numSlides > 0 ? numSlides : 4));

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef();
  const stageRef = useRef();

  // Single, clear angle per slide for circular effect
  const angleStep = numSlides > 0 ? 360 / numSlides : 360;

  // Compute the cylinder radius based on screen and slide count for appropriate depth
  function useResponsiveRadius(count, showN) {
    const [r, setR] = useState(getRadius(window.innerWidth));
    useEffect(() => {
      function handleResize() { setR(getRadius(window.innerWidth)); }
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [count, showN]);
    function getRadius(width) {
      // More perspective for more visible slides; deeper on desktop
      if (width < 600) return 155 + (showN - 1) * 36 + (count - 4) * 7;
      if (width < 900) return 215 + (showN-1)*44 + (count-4)*11;
      return 345 + (showN-1)*57 + (count-4)*18;
    }
    return r;
  }
  const radius = useResponsiveRadius(numSlides, visibleSlideCount);

  // Auto-rotate for showcase; slow for realism/legibility
  useEffect(() => {
    if (!autoRotate || paused || numSlides < 2) return;
    intervalRef.current = setInterval(() => nextSlideSmooth(), rotateInterval);
    return () => clearInterval(intervalRef.current);
  }, [autoRotate, rotateInterval, numSlides, paused, active]);

  // Animation state
  useEffect(() => {
    if (!isAnimating) return;
    // Transition slightly faster (CSS duration is ~0.62s for main slide)
    const t = setTimeout(() => setIsAnimating(false), 470);
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
    // Shows a balanced cylinder regardless of slide count; ensures symmetry
    let min, max;
    if (numSlides <= visibleSlideCount) return true;
    // Handle wrap-around properly, works for both sides
    let half = Math.floor(visibleSlideCount / 2);
    let behind = Math.floor((visibleSlideCount - 1) / 2);
    let ahead = visibleSlideCount - 1 - behind;

    // relPos = how far ahead this slide is from current (modulo numSlides)
    if (relPos === 0) return true;
    if (relPos > 0 && relPos <= ahead) return true;
    if (relPos > numSlides - behind - 1 && relPos < numSlides) return true;
    return false;
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

