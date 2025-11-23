import React from 'react';
import { GameStats, TierConfig, Tier } from '../../types';
import { TIER_CONFIGS } from '../../constants';

interface OverlayProps {
  stats: GameStats;
}

const Overlay: React.FC<OverlayProps> = ({ stats }) => {
  const currentConfig: TierConfig = TIER_CONFIGS[stats.tier];
  const nextTier = (stats.tier + 1) as Tier;
  const nextConfig = TIER_CONFIGS[nextTier];

  const progress = nextConfig 
    ? ((stats.kills - TIER_CONFIGS[stats.tier].minKills) / (nextConfig.minKills - TIER_CONFIGS[stats.tier].minKills)) * 100
    : 100;

  const healthPercent = (stats.health / currentConfig.maxHealth) * 100;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 flex flex-col justify-between z-10">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-sm p-4 rounded-lg border-l-4 border-red-600 text-white w-64">
          <h2 className="text-sm text-gray-400 font-bold uppercase tracking-widest">Score</h2>
          <div className="text-3xl font-black font-mono">{stats.score.toLocaleString()}</div>
          
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-400">MULTIPLIER</span>
            <span className="text-xl text-yellow-500 font-bold">x{(1 + (Math.min(stats.combo, 50) * 0.1)).toFixed(1)}</span>
          </div>
          {stats.combo > 0 && (
             <div className="w-full bg-gray-800 h-1 mt-1 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-yellow-500 transition-all duration-100" 
                    style={{width: `${(stats.comboTimer / 2.0) * 100}%`}}
                />
             </div>
          )}
        </div>

        <div className="bg-black/60 backdrop-blur-sm p-4 rounded-lg text-right">
           <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">Kills</div>
           <div className="text-4xl text-red-500 font-black">{stats.kills}</div>
        </div>
      </div>

      {/* Bottom Bar: Health & Tier */}
      <div className="flex items-end gap-4">
        {/* Health */}
        <div className="flex-1 max-w-md bg-black/60 backdrop-blur-sm p-4 rounded-lg">
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                <span>INTEGRITY</span>
                <span>{Math.ceil(stats.health)}/{currentConfig.maxHealth}</span>
            </div>
            <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div 
                    className={`h-full transition-all duration-200 ${healthPercent < 30 ? 'bg-red-600 animate-pulse' : 'bg-green-500'}`}
                    style={{ width: `${healthPercent}%` }}
                />
            </div>
        </div>

        {/* Tier Info */}
        <div className="flex-1 bg-black/80 backdrop-blur-md p-4 rounded-lg border-t-4" style={{borderColor: `#${currentConfig.color.toString(16)}`}}>
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h3 className="text-xs text-gray-400 font-bold uppercase">Current Vehicle</h3>
                    <div className="text-xl font-bold text-white">{currentConfig.name}</div>
                </div>
                {nextConfig && (
                    <div className="text-right">
                        <div className="text-xs text-gray-500">NEXT UNLOCK</div>
                        <div className="text-sm text-white font-mono">{Math.max(0, nextConfig.minKills - stats.kills)} Kills Left</div>
                    </div>
                )}
            </div>
            
            {nextConfig && (
                <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>
            )}
            
            <div className="mt-2 text-xs text-gray-400 italic">
                {currentConfig.description}
            </div>
        </div>
      </div>

    </div>
  );
};

export default Overlay;