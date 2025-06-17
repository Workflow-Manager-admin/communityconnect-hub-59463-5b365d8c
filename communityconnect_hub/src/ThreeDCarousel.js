import React, { useRef, useState, useEffect, useCallback } from "react";
import "./ThreeDCarousel.css";

/**
 * PUBLIC_INTERFACE
 * ThreeDCarousel - A 3D cylindrical carousel component.
 * 
 * Features:
 * - Slides are distributed around the circumference of a virtual cylinder,
 *   smoothly rotating and animating as user interacts.
 * - Responsive and visually appealing for dark themes.
 * - Accessible controls, pause-on-hover/focus and keyboard navigation.
 *
 * Props:
 *   - slides: Array of JSX elements (required)
 *   - autoRotate: boolean (default: true)
 *   - rotateInterval: number ms (default: 4000)
 */
function ThreeDCarousel({ slides, autoRotate = true, rotateInterval = 4000 }) {
  const numSlides = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef();
  const stageRef = useRef();

  // Compute the rotation angle per slide
  const angleStep = 360 / numSlides;
  // Cylinder Z-translate distance
  const radius = useResponsiveRadius(numSlides);

  // Responsive: adjust the cylinder radius with viewport width & slide count
  function useResponsiveRadius(count) {
    const [r, setR] = useState(getRadius(window.innerWidth));
    useEffect(() => {
      function handleResize() {
        setR(getRadius(window.innerWidth));
      }
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);
    function getRadius(width) {
      if (width < 600) return 160 + (count - 4) * 24;
      if (width < 900) return 240 + (count - 4) * 36;
      return 340 + (count - 4) * 40; // spread out more on desktop
    }
    return r;
  }

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotate || paused || numSlides < 2) return;
    intervalRef.current = setInterval(() => nextSlideSmooth(), rotateInterval);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, [autoRotate, rotateInterval, numSlides, paused, active]);

  // Animation lock to prevent rapid stacking of transitions
  useEffect(() => {
    if (!isAnimating) return;
    const t = setTimeout(() => setIsAnimating(false), 680);
    return () => clearTimeout(t);
  }, [isAnimating]);

  // Keyboard navigation
  function handleKeyDown(e) {
    if (isAnimating) return;
    if (e.key === "ArrowRight") {
      nextSlideSmooth();
    } else if (e.key === "ArrowLeft") {
      prevSlideSmooth();
    }
  }

  // Next/Prev navigation functions with animation guard
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

  // Pause on hover/focus for accessibility
  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  // Touch/Swipe navigation for mobile
  useCarouselSwipe(stageRef, nextSlideSmooth, prevSlideSmooth);

  return (
    <div
      className="three-d-carousel"
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Core Features Carousel"
      onKeyDown={handleKeyDown}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      style={{ outline: "none" }}
    >
      <div
        className={`carousel-3d-stage${isAnimating ? " animating" : ""}`}
        ref={stageRef}
        style={{
          transform: `translateZ(-${radius}px) rotateY(${-active * angleStep}deg)`,
        }}
        aria-live="polite"
      >
        {slides.map((slide, i) => {
          // Each slide positioned around the cylinder
          const theta = i * angleStep;
          const relPos = (i - active + numSlides) % numSlides;
          // For accessibility and performance: show only nearby slides
          const visible = relPos === 0 || relPos === 1 || relPos === numSlides - 1 || numSlides < 4;

          return (
            <div
              className={`carousel-3d-slide${relPos === 0 ? " active" : ""}`}
              key={i}
              aria-hidden={relPos !== 0}
              style={{
                transform: `rotateY(${theta}deg) translateZ(${radius}px)`,
                zIndex: relPos === 0 ? 3 : 1,
                opacity: visible ? (relPos === 0 ? 1 : 0.54) : 0,
                pointerEvents: relPos === 0 ? "auto" : "none"
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
          disabled={isAnimating}
        >
          <span aria-hidden>‹</span>
        </button>
        <button
          className="carousel-3d-arrow right"
          title="Next"
          aria-label="Next Slide"
          tabIndex={0}
          onClick={nextSlideSmooth}
          disabled={isAnimating}
        >
          <span aria-hidden>›</span>
        </button>
      </div>
      <div className="carousel-3d-indicators">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`carousel-3d-indicator${i === active ? " active" : ""}`}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
            tabIndex={0}
            onClick={() => !isAnimating && setActive(i)}
            disabled={isAnimating || i === active}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Adds touch-swipe navigation to the given ref element.
 */
function useCarouselSwipe(ref, onNext, onPrev) {
  useEffect(() => {
    if (!ref.current) return;
    let startX = null;
    let deltaX = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      deltaX = 0;
    };
    const handleTouchMove = (e) => {
      if (startX !== null) {
        deltaX = e.touches[0].clientX - startX;
      }
    };
    const handleTouchEnd = () => {
      if (startX !== null && Math.abs(deltaX) > 38) {
        if (deltaX < 0) onNext();
        else onPrev();
      }
      startX = null;
      deltaX = 0;
    };
    const node = ref.current;
    node.addEventListener("touchstart", handleTouchStart, { passive: true });
    node.addEventListener("touchmove", handleTouchMove, { passive: true });
    node.addEventListener("touchend", handleTouchEnd);
    return () => {
      node.removeEventListener("touchstart", handleTouchStart);
      node.removeEventListener("touchmove", handleTouchMove);
      node.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ref, onNext, onPrev]);
}

export default ThreeDCarousel;
