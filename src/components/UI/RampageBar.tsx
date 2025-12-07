import React from 'react';
import { RAMPAGE_DIMENSION } from '../../constants';

interface RampageBarProps {
  combo: number;
  comboTimer: number;
  inRampageDimension: boolean;
  rampageProgress: number;
}

/**
 * RampageBar - Compact terminal-style rampage progress
 */
const RampageBar: React.FC<RampageBarProps> = ({
  combo,
  comboTimer,
  inRampageDimension,
  rampageProgress,
}) => {
  const threshold = RAMPAGE_DIMENSION.COMBO_THRESHOLD;

  // Don't show if no combo
  if (combo === 0 && !inRampageDimension) {
    return null;
  }

  const isActive = inRampageDimension;
  const barLength = 12;
  const progressValue = isActive ? (comboTimer / 5.0) * 100 : rampageProgress;

  const filledBlocks = Math.round((progressValue / 100) * barLength);
  const filled = "=".repeat(filledBlocks);
  const empty = "-".repeat(barLength - filledBlocks);

  return (
    <div
      className={`bg-black/90 px-3 py-1.5 font-mono ${isActive ? 'ring-1 ring-red-500/50' : ''}`}
      style={{
        boxShadow: isActive ? '0 0 12px rgba(255, 0, 0, 0.3)' : 'none',
      }}
    >
      <div className="flex items-center gap-2 text-[11px]">
        <span className={`uppercase font-bold ${isActive ? 'text-red-500 animate-pulse' : 'text-orange-400'}`}>
          {isActive ? 'RAMPAGE' : `${combo}/${threshold}`}
        </span>
        <span className="text-neutral-700">[</span>
        <span className={isActive ? 'text-red-500' : 'text-orange-500'}>{filled}</span>
        <span className="text-neutral-700">{empty}</span>
        <span className="text-neutral-700">]</span>
        {isActive && <span className="text-red-400 tabular-nums">{comboTimer.toFixed(1)}s</span>}
      </div>
    </div>
  );
};

export default RampageBar;
