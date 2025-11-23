import React, { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import Overlay from './components/UI/Overlay';
import { MainMenu, GameOver } from './components/UI/Menus';
import { GameState, GameStats, Tier } from './types';
import { TIER_CONFIGS } from './constants';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [stats, setStats] = useState<GameStats>({
    kills: 0,
    score: 0,
    health: 100,
    tier: Tier.FOOT,
    combo: 0,
    comboTimer: 0,
    gameTime: 0,
    killHistory: []
  });

  const handleStatsUpdate = useCallback((newStats: GameStats) => {
    // We update state frequently, React 18 auto-batching handles this well
    setStats(newStats);
  }, []);

  const handleGameOver = useCallback((finalStats: GameStats) => {
    setStats(finalStats);
    setGameState(GameState.GAME_OVER);
  }, []);

  const startGame = () => {
    setGameState(GameState.PLAYING);
    // Reset handled by GameEngine.start()
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-900 select-none">
      
      {/* 3D Game Layer */}
      <GameCanvas 
        gameActive={gameState === GameState.PLAYING}
        onStatsUpdate={handleStatsUpdate}
        onGameOver={handleGameOver}
      />

      {/* UI Layers */}
      {gameState === GameState.MENU && (
        <MainMenu onStart={startGame} />
      )}

      {gameState === GameState.PLAYING && (
        <Overlay stats={stats} />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOver stats={stats} onRestart={startGame} />
      )}
      
      {/* Mobile Controls Hint (Visible only on touch devices ideally, simplified here) */}
      {gameState === GameState.PLAYING && (
         <div className="absolute bottom-4 left-0 w-full text-center text-white/20 text-xs pointer-events-none md:hidden">
             SWIPE TO MOVE • TAP TO ATTACK
         </div>
      )}
    </div>
  );
}

export default App;