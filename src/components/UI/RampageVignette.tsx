import React, { useState, useEffect, useRef } from 'react';

interface RampageVignetteProps {
  active: boolean;
}

/**
 * RampageVignette - Red screen edge vignette during rampage mode
 * Adds intensity and frames the white void
 *
 * Phase 2: Also handles screen flash on rampage entry
 */
const RampageVignette: React.FC<RampageVignetteProps> = ({ active }) => {
  const [showFlash, setShowFlash] = useState(false);
  const prevActiveRef = useRef(active);

  // Trigger flash when transitioning from inactive to active
  useEffect(() => {
    if (active && !prevActiveRef.current) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 100);
      return () => clearTimeout(timer);
    }
    prevActiveRef.current = active;
  }, [active]);

  return (
    <>
      {/* Screen flash on rampage entry */}
      {showFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-[100]"
          style={{
            background: 'white',
            animation: 'rampage-flash 0.1s ease-out forwards',
          }}
        />
      )}

      {/* Vignette effect during rampage */}
      {active && (
        <div
          className="fixed inset-0 pointer-events-none z-[5]"
          style={{
            background: `
              radial-gradient(
                ellipse at center,
                transparent 40%,
                rgba(180, 0, 0, 0.15) 70%,
                rgba(120, 0, 0, 0.35) 100%
              )
            `,
            animation: 'pulse-vignette 2s ease-in-out infinite',
          }}
        />
      )}

      <style>{`
        @keyframes pulse-vignette {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes rampage-flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
};

export default RampageVignette;
