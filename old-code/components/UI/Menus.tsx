import React from 'react';
import { GameStats, Tier } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TIER_CONFIGS } from '../../constants';

interface MainMenuProps {
  onStart: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 text-white">
      <div className="max-w-2xl text-center space-y-8 p-8 border-2 border-red-900 bg-neutral-900 shadow-2xl shadow-red-900/20 rounded-xl relative overflow-hidden">
        
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-orange-600"></div>
        
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_4px_0_rgba(255,0,0,0.5)]">
          RAMPAGE<br/>RIDER
        </h1>
        
        <p className="text-xl text-gray-400 font-mono">
          START ON FOOT. KILL TO UPGRADE. SURVIVE THE CHAOS.
        </p>

        <div className="grid grid-cols-2 gap-4 text-left bg-black/50 p-4 rounded font-mono text-sm border border-gray-800">
            <div>
                <span className="text-red-500">WASD</span> to Move
            </div>
            <div>
                <span className="text-red-500">SPACE</span> to Attack
            </div>
            <div>
                <span className="text-red-500">Crash</span> Pedestrians
            </div>
            <div>
                <span className="text-red-500">Avoid</span> Cops (at first)
            </div>
        </div>

        <button 
            onClick={onStart}
            className="px-12 py-4 bg-red-600 hover:bg-red-700 text-white text-2xl font-bold rounded transform hover:scale-105 transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] border-b-4 border-red-900 active:border-b-0 active:translate-y-1"
        >
            INITIATE RAMPAGE
        </button>
      </div>
    </div>
  );
};

interface GameOverProps {
  stats: GameStats;
  onRestart: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ stats, onRestart }) => {
  
  // Prepare data for chart - simulating history since engine doesn't track full history array in this MVP version
  // We'll just show current session breakdown vs hypothetical average
  const data = [
    { name: 'Kills', value: stats.kills, color: '#ef4444' },
    { name: 'Score/100', value: Math.floor(stats.score / 100), color: '#fbbf24' },
    { name: 'Time(s)', value: Math.floor(stats.gameTime), color: '#3b82f6' },
  ];

  const config = TIER_CONFIGS[stats.tier];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/90 backdrop-blur-md text-white">
      <div className="w-full max-w-3xl p-8 bg-neutral-900 border-4 border-black shadow-2xl rounded-xl">
        <h2 className="text-6xl font-black text-center mb-2 text-white uppercase tracking-widest animate-pulse">
            BUSTED!
        </h2>
        
        <div className="text-center text-gray-400 font-mono mb-8">
            VEHICLE DESTROYED • CRITICAL FAILURE
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
                <div className="bg-black p-4 rounded border border-gray-800">
                    <div className="text-xs text-gray-500 uppercase">Final Score</div>
                    <div className="text-4xl font-bold text-yellow-500">{stats.score.toLocaleString()}</div>
                </div>
                <div className="bg-black p-4 rounded border border-gray-800">
                    <div className="text-xs text-gray-500 uppercase">Casualties</div>
                    <div className="text-4xl font-bold text-red-500">{stats.kills}</div>
                </div>
                <div className="bg-black p-4 rounded border border-gray-800">
                    <div className="text-xs text-gray-500 uppercase">Reached Tier</div>
                    <div className="text-2xl font-bold" style={{color: `#${config.color.toString(16)}`}}>
                        {config.name}
                    </div>
                </div>
            </div>

            <div className="bg-black p-4 rounded border border-gray-800 h-64 flex flex-col">
                <div className="text-xs text-gray-500 uppercase mb-2">Run Analysis</div>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12}} />
                            <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#111', border: '1px solid #333'}}
                                cursor={{fill: 'rgba(255,255,255,0.1)'}}
                            />
                            <Bar dataKey="value">
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        <div className="text-center">
            <button 
                onClick={onRestart}
                className="px-8 py-3 bg-white text-black text-xl font-bold hover:bg-gray-200 transition-colors uppercase tracking-widest"
            >
                Try Again
            </button>
        </div>
      </div>
    </div>
  );
};