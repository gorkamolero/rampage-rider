import React, { useState } from 'react';
import { GameStats, TierConfig, Tier } from '../../types';
import { TIER_CONFIGS, DEBUG_PERFORMANCE_PANEL } from '../../constants';
import { Button } from '@/components/ui/8bit/button';
import { TextBar, WantedStars } from '@/components/ui/8bit/text-bar';
import RampageBar from './RampageBar';
import RampageVignette from './RampageVignette';

interface OverlayProps {
  stats: GameStats;
}

const Overlay: React.FC<OverlayProps> = ({ stats }) => {
  const [uiHidden, setUiHidden] = useState(false);
  const currentConfig: TierConfig = TIER_CONFIGS[stats.tier];
  const nextTier = (stats.tier + 1) as Tier;
  const nextConfig = TIER_CONFIGS[nextTier];

  const progress = nextConfig
    ? ((stats.score - TIER_CONFIGS[stats.tier].minScore) / (nextConfig.minScore - TIER_CONFIGS[stats.tier].minScore)) * 100
    : 100;

  const multiplier = 1 + (Math.min(stats.combo, 50) * 0.1);

  // Progress bar characters
  const progressLength = 12;
  const progressFilled = Math.round((Math.min(100, Math.max(0, progress)) / 100) * progressLength);
  const progressBar = "=".repeat(progressFilled) + "-".repeat(progressLength - progressFilled);

  return (
    <>
      <RampageVignette active={stats.inRampageDimension || false} />

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-3 flex flex-col justify-between z-10">

        {/* Screenshot Toggle */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setUiHidden(!uiHidden)}
          className="absolute top-3 right-3 pointer-events-auto bg-black/60 hover:bg-black/80 text-neutral-400 hover:text-white z-20 w-7 h-7 text-xs"
        >
          {uiHidden ? '👁' : '📷'}
        </Button>

        {uiHidden ? null : (
          <>
            {/* Cop Health Dots */}
            {stats.copHealthBars?.map((cop, index) => (
              <div
                key={index}
                className="absolute flex gap-0.5"
                style={{
                  left: `${cop.x}px`,
                  top: `${cop.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {[...Array(cop.maxHealth)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full border border-black ${
                      i < cop.health ? 'bg-red-500' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            ))}

            {/* Performance Monitor */}
            {DEBUG_PERFORMANCE_PANEL && stats.performance && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/90 p-2 rounded border border-green-500/50 font-mono text-[10px] text-green-400" style={{ transform: 'scale(0.7) translateY(-50%)', transformOrigin: 'right center' }}>
                <div className="text-green-300 mb-1 text-center">PERF</div>
                <div>FPS: <span className={stats.performance.fps < 30 ? 'text-red-500' : stats.performance.fps < 50 ? 'text-yellow-500' : 'text-green-400'}>{stats.performance.fps.toFixed(0)}</span></div>
                <div>Frame: {stats.performance.frameTime.toFixed(1)}ms</div>
              </div>
            )}

            {/* TOP ROW */}
            <div className="flex justify-between items-start">
              {/* Score - Top Left */}
              <div className="bg-black/90 px-3 py-2 font-mono">
                <div className="text-neutral-600 text-[10px] uppercase tracking-wider">Score</div>
                <div className="text-white text-xl font-bold tabular-nums">{stats.score.toLocaleString()}</div>
                <div className="text-neutral-600 text-[10px]">
                  ×<span className={multiplier > 1 ? "text-yellow-400" : "text-neutral-500"}>{multiplier.toFixed(1)}</span>
                  {stats.combo > 0 && <span className="ml-2 text-orange-400">C{stats.combo}</span>}
                </div>
              </div>

              {/* Rampage Bar - Center */}
              <RampageBar
                combo={stats.combo}
                comboTimer={stats.comboTimer}
                inRampageDimension={stats.inRampageDimension || false}
                rampageProgress={stats.rampageProgress || 0}
              />

              {/* Kills - Top Right */}
              <div className="bg-black/90 px-3 py-2 font-mono text-right">
                <div className="text-neutral-600 text-[10px] uppercase tracking-wider">Kills</div>
                <div className="text-red-500 text-2xl font-bold tabular-nums">{stats.kills}</div>
              </div>
            </div>

            {/* BOTTOM ROW */}
            <div className="flex justify-between items-end">
              {/* Status - Bottom Left */}
              <div className="bg-black/90 px-3 py-2 space-y-0.5">
                <WantedStars stars={stats.wantedStars} />
                <TextBar label="HEAT" value={stats.heat} max={100} showValue={false} color="heat" barLength={10} />
                {stats.isInVehicle && stats.vehicleHealth !== undefined && stats.vehicleMaxHealth !== undefined ? (
                  <TextBar label="ARMOR" value={stats.vehicleHealth} max={stats.vehicleMaxHealth} color="cyan" barLength={10} />
                ) : (
                  <TextBar label="HP" value={stats.health} max={currentConfig.maxHealth} color="red" barLength={10} />
                )}
              </div>

              {/* Vehicle - Bottom Right */}
              <div className="bg-black/90 px-3 py-2 font-mono text-right">
                <div className="text-neutral-600 text-[10px] uppercase tracking-wider">Vehicle</div>
                <div className="text-white text-sm font-bold">{currentConfig.name}</div>
                {nextConfig && (
                  <div className="text-[10px] text-neutral-600 mt-0.5">
                    <span className="text-neutral-500">{nextConfig.name}</span>
                    <span className="text-neutral-700 ml-1">[</span>
                    <span className="text-cyan-500">{progressBar}</span>
                    <span className="text-neutral-700">]</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Overlay;
