import React, { useRef, useState, useEffect } from "react";
import "./ThreeDCarousel.css";

// PUBLIC_INTERFACE
/**
 * 3DCarousel - A modern 3D slider/carousel for rotating feature content.
 * Features smooth perspective rotation, indicators, and responsive design.
 * Accepts an array of slides (JSX or content).
 *
 * Props:
 *   slides: Array of JSX elements (required)
 *   autoRotate: boolean (default: true)
 *   rotateInterval: number ms (default: 4000)
 */
function ThreeDCarousel({ slides, autoRotate = true, rotateInterval = 4000 }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const numSlides = slides.length;
  const intervalRef = useRef();

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotate || paused || numSlides < 2) return;
    intervalRef.current = setInterval(() => {
      setActive(a => (a + 1) % numSlides);
    }, rotateInterval);
    return () => clearInterval(intervalRef.current);
  }, [autoRotate, rotateInterval, numSlides, paused]);

  // Keyboard navigation
  function handleKeyDown(e) {
    if (e.key === "ArrowRight") {
      setActive(a => (a + 1) % numSlides);
    } else if (e.key === "ArrowLeft") {
      setActive(a => (a - 1 + numSlides) % numSlides);
    }
  }

  // Pause on hover/focus for accessibility
  function pause() { setPaused(true); }
  function resume() { setPaused(false); }

  return (
    <div
      className="three-d-carousel"
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Core CommunityConnect Features"
      onKeyDown={handleKeyDown}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      style={{ outline: "none" }}
    >
      <div className="carousel-3d-stage">
        {slides.map((slide, i) => {
          // Math for 3D arrangement
          const theta = (360 / numSlides) * (i - active);
          // Active slide is centered, others are angled
          const isActive = i === active;
          return (
            <div
              className={`carousel-3d-slide${isActive ? " active" : ""}`}
              key={i}
              aria-hidden={!isActive}
              style={{
                transform: `rotateY(${theta}deg) translateZ(460px)`,
                zIndex: isActive ? 2 : 1,
                pointerEvents: isActive ? "auto" : "none",
                opacity: isActive ? 1 : 0.61
              }}>
              {slide}
            </div>
          );
        })}
      </div>
      <div className="carousel-3d-indicators">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`carousel-3d-indicator${i === active ? " active" : ""}`}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
            tabIndex={0}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default ThreeDCarousel;
