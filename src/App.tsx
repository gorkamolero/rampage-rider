import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import Overlay from './components/ui/Overlay';
import NotificationSystem, { NotificationController } from './components/ui/NotificationSystem';
import SnowOverlay from './components/ui/SnowOverlay';
import VehicleSelector from './components/ui/VehicleSelector';
import { GameOver } from './components/ui/Menus';
import LoadingScreen from './components/ui/LoadingScreen';
import { GameState, GameStats, Tier, KillNotification } from './types';
import { VehicleType } from './constants';
import ErrorBoundary from './components/ErrorBoundary';
import { preloader, LoadingState } from './core/Preloader';
import { gameAudio } from './audio';

interface EngineControls {
  spawnVehicle: (type: VehicleType | null) => void;
}

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [loadingState, setLoadingState] = useState<LoadingState>(() => preloader.getState());

  // Preload heavy assets (Rapier WASM + models) on mount
  useEffect(() => {
    const unsubscribe = preloader.addProgressListener((state) => {
      setLoadingState(state);
    });

    preloader.preloadAll().catch(() => {
      // Errors already logged by loaders
    });

    // Initialize audio and start menu music
    gameAudio.init().then(() => {
      gameAudio.playMenuMusic();
      gameAudio.startAmbient();
    });

    return () => {
      unsubscribe();
    };
  }, []);
  const [stats, setStats] = useState<GameStats>({
    kills: 0,
    copKills: 0,
    score: 0,
    health: 100,
    tier: Tier.FOOT,
    combo: 0,
    comboTimer: 0,
    gameTime: 0,
    heat: 0,
    wantedStars: 0,
    inPursuit: false,
    inRampageMode: false,
    rampageKills: 0,
    rampageKillLimit: 15,
    killHistory: [],
    copHealthBars: [],
    isTased: false,
    taseEscapeProgress: 0
  });

  const handleStatsUpdate = useCallback((newStats: GameStats) => {
    setStats(newStats);
  }, []);

  const handleGameOver = useCallback((finalStats: GameStats) => {
    setStats(finalStats);
    setGameState(GameState.GAME_OVER);
  }, []);

  // Unified notification system
  const notificationControllerRef = useRef<NotificationController | null>(null);

  const handleKillNotification = useCallback((notification: KillNotification) => {
    if (notificationControllerRef.current) {
      // Use explicit type if provided, otherwise infer from isPursuit
      const type = notification.type || (notification.isPursuit ? 'pursuit' : 'kill');
      const subtext = notification.points > 0 ? `+${notification.points}` : undefined;
      notificationControllerRef.current.addNotification(type, notification.message, subtext, notification.combo);
    }
  }, []);

  const registerNotificationController = useCallback((controller: NotificationController) => {
    notificationControllerRef.current = controller;
  }, []);

  const startGame = () => {
    // Resume audio context (requires user interaction)
    gameAudio.resume();
    gameAudio.playGameStart();
    setGameState(GameState.PLAYING);
  };

  const togglePause = useCallback(() => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
    } else if (gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
    }
  }, [gameState]);

  // Debug vehicle spawning (dev only)
  const engineControlsRef = useRef<EngineControls | null>(null);
  const [currentVehicle, setCurrentVehicle] = useState<VehicleType | null>(null);

  const handleEngineReady = useCallback((controls: EngineControls) => {
    engineControlsRef.current = controls;
  }, []);

  const handleVehicleSelect = useCallback((vehicleType: VehicleType | null) => {
    if (engineControlsRef.current) {
      engineControlsRef.current.spawnVehicle(vehicleType);
      setCurrentVehicle(vehicleType);
    }
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-900 select-none">

      {/* 3D Game Layer */}
      <ErrorBoundary>
        <GameCanvas
          gameActive={gameState === GameState.PLAYING}
          onStatsUpdate={handleStatsUpdate}
          onGameOver={handleGameOver}
          onKillNotification={handleKillNotification}
          onEngineReady={handleEngineReady}
          onPauseToggle={togglePause}
        />
      </ErrorBoundary>

      {/* Loading Screen / Main Menu (combined) */}
      {gameState === GameState.MENU && (
        <LoadingScreen state={loadingState} onStart={startGame} />
      )}

      {gameState === GameState.PLAYING && (
        <>
          {!stats.inRampageMode && <SnowOverlay />}
          <Overlay stats={stats} />
          <NotificationSystem
            onRegister={registerNotificationController}
            showEnterPrompt={stats.isNearCar && !stats.isInVehicle}
            showTasedAlert={stats.isTased}
            taseEscapeProgress={stats.taseEscapeProgress}
          />
          {/* Dev-only vehicle selector - below top bar on mobile, centered on desktop */}
          {import.meta.env.DEV && (
            <div className="absolute top-14 md:top-4 left-1/2 -translate-x-1/2 z-40 flex gap-2 bg-black/60 p-1 md:p-2 rounded-lg border border-white/20">
              <VehicleSelector onSelect={handleVehicleSelect} currentVehicle={currentVehicle} />
            </div>
          )}
        </>
      )}

      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white retro mb-8">PAUSED</h1>
            <p className="text-white/60 text-sm retro">Press ESC to resume</p>
          </div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOver stats={stats} onRestart={startGame} />
      )}

      {/* Mobile Controls Hint */}
      {gameState === GameState.PLAYING && (
         <div className="absolute bottom-4 left-0 w-full text-center text-white/20 text-xs pointer-events-none md:hidden">
             SWIPE TO MOVE • TAP TO ATTACK
         </div>
      )}
    </div>
  );
}

export default App;
