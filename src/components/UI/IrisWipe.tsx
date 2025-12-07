import React, { useEffect, useState } from 'react';

interface IrisWipeProps {
  isOpen: boolean;
  duration?: number;
  onComplete?: () => void;
}

/**
 * Iris wipe transition effect - circle expands from center to reveal content
 * Classic "Bugs Bunny" / Looney Tunes style reveal
 */
export const IrisWipe: React.FC<IrisWipeProps> = ({
  isOpen,
  duration = 800,
  onComplete
}) => {
  const [clipRadius, setClipRadius] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Animate the circle expanding
      const startTime = performance.now();
      const maxRadius = 150; // percentage - needs to cover corners

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        setClipRadius(eased * maxRadius);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsVisible(false);
          onComplete?.();
        }
      };

      requestAnimationFrame(animate);
    } else {
      setClipRadius(0);
      setIsVisible(true);
    }
  }, [isOpen, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[150] pointer-events-none"
      style={{
        background: '#000',
        clipPath: `circle(${clipRadius}% at 50% 50%)`,
        // Invert - we want the BLACK to be outside the circle
        // So we use a mask instead
      }}
    />
  );
};

/**
 * Inverse iris wipe - black covers everything except expanding circle
 */
export const IrisWipeReveal: React.FC<IrisWipeProps> = ({
  isOpen,
  duration = 800,
  onComplete
}) => {
  const [clipRadius, setClipRadius] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Animate the circle expanding
      const startTime = performance.now();
      const maxRadius = 150; // percentage - needs to cover corners

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        setClipRadius(eased * maxRadius);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsComplete(true);
          onComplete?.();
        }
      };

      requestAnimationFrame(animate);
    } else {
      setClipRadius(0);
      setIsComplete(false);
    }
  }, [isOpen, duration, onComplete]);

  if (isComplete) return null;

  // SVG mask approach for the "reveal" effect
  // The black area is everything OUTSIDE the circle
  return (
    <div className="fixed inset-0 z-[150] pointer-events-none">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <mask id="iris-mask">
            {/* White = visible, Black = hidden */}
            <rect width="100%" height="100%" fill="white" />
            <circle cx="50%" cy="50%" r={`${clipRadius}%`} fill="black" />
          </mask>
        </defs>
        {/* Black rectangle with circle cut out */}
        <rect
          width="100%"
          height="100%"
          fill="black"
          mask="url(#iris-mask)"
        />
      </svg>
    </div>
  );
};

export default IrisWipeReveal;
