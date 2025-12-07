import React from 'react';
import { RAMPAGE_DIMENSION } from '../../constants';

const NEON = {
  red: '#FF3333',
  orange: '#FF8800',
};

interface RampageBarProps {
  combo: number;
  comboTimer: number;
  inRampageDimension: boolean;
  rampageProgress: number;
  compact?: boolean;
}

const RampageBar: React.FC<RampageBarProps> = ({
  combo,
  comboTimer,
  inRampageDimension,
  rampageProgress,
  compact = false,
}) => {
  const threshold = RAMPAGE_DIMENSION.COMBO_THRESHOLD;

  if (combo === 0 && !inRampageDimension) {
    return null;
  }

  const isActive = inRampageDimension;
  const blocks = compact ? 8 : 12;
  const progressValue = isActive ? (comboTimer / 5.0) * 100 : rampageProgress;
  const filled = Math.round((progressValue / 100) * blocks);
  const color = isActive ? NEON.red : NEON.orange;

  // Compact mobile version
  if (compact) {
    return (
      <div
        className="bg-black/90 px-2 py-1 border-t-2"
        style={{ borderColor: color }}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-[9px] retro font-bold ${isActive ? 'animate-pulse' : ''}`}
            style={{ color, textShadow: `0 0 6px ${color}` }}
          >
            {isActive ? 'RAMPAGE' : `${combo}/${threshold}`}
          </span>
          <div className="flex gap-[1px]">
            {Array.from({ length: blocks }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-2"
                style={{
                  background: i < filled ? color : '#1a1a1a',
                  boxShadow: i < filled ? `0 0 3px ${color}80` : 'none',
                }}
              />
            ))}
          </div>
          {isActive && (
            <span className="text-[9px] retro tabular-nums" style={{ color }}>{comboTimer.toFixed(1)}s</span>
          )}
        </div>
      </div>
    );
  }

  // Full desktop version
  return (
    <div className="relative">
      <div
        className="bg-black px-4 py-2 border-2"
        style={{
          borderColor: color,
          boxShadow: isActive ? `0 0 20px ${color}60, inset 0 0 15px ${color}20` : `0 0 10px ${color}30`,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-xs retro font-bold tracking-wider ${isActive ? 'animate-pulse' : ''}`}
            style={{ color, textShadow: `0 0 8px ${color}` }}
          >
            {isActive ? 'RAMPAGE!' : `${combo}/${threshold}`}
          </span>

          <div className="flex gap-[2px]">
            {Array.from({ length: blocks }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-3"
                style={{
                  background: i < filled ? color : '#1a1a1a',
                  boxShadow: i < filled ? `0 0 4px ${color}80` : 'none',
                }}
              />
            ))}
          </div>

          {isActive && (
            <span
              className="text-xs retro tabular-nums"
              style={{ color, textShadow: `0 0 6px ${color}` }}
            >
              {comboTimer.toFixed(1)}s
            </span>
          )}
        </div>
      </div>
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: color }} />
      <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: color }} />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2" style={{ borderColor: color }} />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2" style={{ borderColor: color }} />
    </div>
  );
};

export default RampageBar;
