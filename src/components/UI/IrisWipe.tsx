import React, { useEffect, useState } from 'react';

interface IrisWipeProps {
  /** When true, shows black screen then opens. When false, hides. */
  isActive: boolean;
  /** When true, starts the reveal animation */
  isReady: boolean;
  duration?: number;
  onComplete?: () => void;
}

/**
 * Iris wipe transition - black screen that opens from center
 * 1. isActive=true: Shows full black screen
 * 2. isReady=true: Animates circle expanding to reveal content
 * 3. Animation complete: Calls onComplete and hides
 */
export const IrisWipeReveal: React.FC<IrisWipeProps> = ({
  isActive,
  isReady,
  duration = 600,
  onComplete
}) => {
  const [clipRadius, setClipRadius] = useState(0);
  const [phase, setPhase] = useState<'hidden' | 'waiting' | 'animating' | 'done'>('hidden');

  // Handle activation
  useEffect(() => {
    if (isActive && phase === 'hidden') {
      setPhase('waiting');
      setClipRadius(0);
    } else if (!isActive && phase === 'done') {
      setPhase('hidden');
    }
  }, [isActive, phase]);

  // Handle ready -> animate
  useEffect(() => {
    if (isReady && phase === 'waiting') {
      setPhase('animating');
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
          setPhase('done');
          onComplete?.();
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isReady, phase, duration, onComplete]);

  // Don't render when hidden or done
  if (phase === 'hidden' || phase === 'done') return null;

  // SVG mask approach for the "reveal" effect
  // The black area is everything OUTSIDE the circle
  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <mask id="iris-mask">
            {/* White = visible (black overlay), Black = hidden (transparent) */}
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
