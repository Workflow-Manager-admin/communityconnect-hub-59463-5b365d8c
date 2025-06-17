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
  // More natural, slightly quicker but smooth auto-rotation (was 4100)
  rotateInterval = 3200,
  // Set the clear visible slide count to 5 (as requested, best for cyl effect and content visibility)
  visibleSlideCount = 5,
  // Deepen the perspective for even more pronounced 3D (stronger than before)
  perspective = 1950,
  carouselData = null,
}) {
  // Accept slides or fallback to dynamic carouselData
  let carouselSlides = Array.isArray(slides)
    ? slides
    : (Array.isArray(carouselData)
      ? carouselData.map(renderDataToSlide) : []);
  const numSlides = carouselSlides.length;

  // Clamp: ensure 4 <= visibleSlideCount <= 6, but never > slides present
  visibleSlideCount = Math.max(4, Math.min(visibleSlideCount, 6, numSlides > 0 ? numSlides : 4));

  // Ensure always odd for balance (when <numSlides allows)
  if (numSlides > 4 && visibleSlideCount % 2 === 0) visibleSlideCount--;

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef();
  const stageRef = useRef();

  // Per-slide angle for 3D roundness
  const angleStep = numSlides > 0 ? 360 / numSlides : 360;

  // Compute 3D radius responsively, with stronger depth (cylinder feeling!) on desktop
  function useResponsiveRadius(count, showN) {
    const [r, setR] = useState(getRadius(window.innerWidth));
    useEffect(() => {
      function handleResize() { setR(getRadius(window.innerWidth)); }
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [count, showN]);
    function getRadius(width) {
      // Sharper depth: side slides fall away more for 3D illusion
      if (width < 500) return 120 + (showN - 1) * 34 + (count - 4) * 8;
      if (width < 900) return 210 + (showN - 1) * 52 + (count - 4) * 15;
      return 425 + (showN - 1) * 72 + (count - 4) * 21;
    }
    return r;
  }
  const radius = useResponsiveRadius(numSlides, visibleSlideCount);

  // Smooth auto-rotate logic
  useEffect(() => {
    if (!autoRotate || paused || numSlides < 2) return;
    intervalRef.current = setInterval(() => nextSlideSmooth(), rotateInterval);
    return () => clearInterval(intervalRef.current);
  }, [autoRotate, rotateInterval, numSlides, paused, active]);

  // Animation state for disabling rapid user nav
  useEffect(() => {
    if (!isAnimating) return;
    // Slightly slower than CSS (matches .62s in css) for smoothness
    const t = setTimeout(() => setIsAnimating(false), 630);
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

  // For a cylinder: only show actual visible slide count
  function getVisible(relPos) {
    // Sides wrap; use abs for both direction
    if (numSlides <= visibleSlideCount) return true;
    let halfCount = Math.floor(visibleSlideCount / 2);
    if (relPos === 0) return true;
    if (relPos <= halfCount) return true; // after active, up to visible edge
    if (relPos >= numSlides - halfCount) return true; // before active, wraps around
    return false;
  }

  // For main/side/far slides, provide custom opacity/blur for realism cylinder (side slides fade out)
  function getStyle(relPos) {
    if (relPos === 0) {
      return { opacity: 1, zIndex: 10, filter: "none", pointerEvents: "auto" };
    }
    const half = Math.floor(visibleSlideCount / 2);
    let sideOrFar = (relPos <= half && relPos !== 0)
      || (relPos > numSlides - half && relPos < numSlides);

    if (sideOrFar) {
      // balanced inner side slide
      return { opacity: 0.54, filter: "blur(4px) grayscale(0.5)", zIndex: 3, pointerEvents: "none" };
    }
    // farther ones (at outer edge of visible window), fade to background
    return { opacity: 0.30, filter: "blur(8px) grayscale(0.8) brightness(0.93)", zIndex: 1, pointerEvents: "none" };
  }

  // aria-live: current slide info for accessibility
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
        background: "linear-gradient(98deg, #111124 70%, #19192d 100%)",
        filter: "drop-shadow(0 19px 90px #000a) brightness(1.02)"
      }}
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
          // circular offset
          const relPos = (i - active + numSlides) % numSlides;
          // show only right amount of slides for strong cylinder
          if (!getVisible(relPos)) return null;
          return (
            <div
              className={`carousel-3d-slide${relPos === 0 ? " active" : ""}`}
              key={i}
              aria-hidden={relPos !== 0}
              tabIndex={relPos === 0 ? 0 : -1}
              style={{
                transform: `rotateY(${theta}deg) translateZ(${radius}px)`,
                transitionDelay: isAnimating && relPos === 0 ? "0.05s" : "0s",
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

