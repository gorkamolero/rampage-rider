import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../services/gameEngine';
import { GameStats, InputState } from '../types';

interface GameCanvasProps {
  onStatsUpdate: (stats: GameStats) => void;
  onGameOver: (stats: GameStats) => void;
  gameActive: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onStatsUpdate, onGameOver, gameActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Input Handling
  useEffect(() => {
    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      if (!engineRef.current) return;

      const input: InputState = (engineRef.current as any).input; // Access current input
      
      switch(e.code) {
        case 'ArrowUp':
        case 'KeyW': input.up = isDown; break;
        case 'ArrowDown':
        case 'KeyS': input.down = isDown; break;
        case 'ArrowLeft':
        case 'KeyA': input.left = isDown; break;
        case 'ArrowRight':
        case 'KeyD': input.right = isDown; break;
        case 'Space': input.action = isDown; break;
        case 'KeyE': input.mount = isDown; break;
      }
      engineRef.current.handleInput(input);
    };

    const onKeyDown = (e: KeyboardEvent) => handleKey(e, true);
    const onKeyUp = (e: KeyboardEvent) => handleKey(e, false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Init Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(
      canvasRef.current,
      window.innerWidth,
      window.innerHeight
    );
    
    engine.setCallbacks(onStatsUpdate, onGameOver);
    engineRef.current = engine;

    const handleResize = () => {
      engine.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        engine.stop();
        window.removeEventListener('resize', handleResize);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start/Stop based on prop
  useEffect(() => {
    if (engineRef.current) {
        if (gameActive) {
            engineRef.current.start();
        } else {
            engineRef.current.stop();
        }
    }
  }, [gameActive]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full block z-0 bg-neutral-900"
    />
  );
};

export default GameCanvas;