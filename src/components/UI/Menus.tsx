import React from 'react';
import { GameStats } from '../../types';
import { TIER_CONFIGS } from '../../constants';

interface MainMenuProps {
  onStart: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      zIndex: 50,
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
      }}>
        <h1 style={{
          fontSize: '72px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#ff3333',
        }}>
          RAMPAGE RIDER
        </h1>

        <p style={{
          fontSize: '18px',
          marginBottom: '40px',
          color: '#888',
        }}>
          START ON FOOT. KILL TO UPGRADE. SURVIVE THE CHAOS.
        </p>

        <button
          onClick={onStart}
          style={{
            padding: '20px 60px',
            background: '#ff3333',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#cc0000'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#ff3333'}
        >
          START GAME
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
  const config = TIER_CONFIGS[stats.tier];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(139, 0, 0, 0.9)',
      color: 'white',
      zIndex: 50,
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: '#1a1a1a',
        borderRadius: '12px',
        border: '2px solid #333',
      }}>
        <h2 style={{
          fontSize: '60px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#ff3333',
        }}>
          BUSTED!
        </h2>

        <div style={{
          marginBottom: '30px',
          fontSize: '18px',
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Score:</strong> {stats.score.toLocaleString()}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Kills:</strong> {stats.kills}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Tier:</strong> {config.name}
          </div>
          <div>
            <strong>Time:</strong> {Math.floor(stats.gameTime)}s
          </div>
        </div>

        <button
          onClick={onRestart}
          style={{
            padding: '15px 40px',
            background: 'white',
            color: 'black',
            fontSize: '20px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#ddd'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
        >
          TRY AGAIN
        </button>
      </div>
    </div>
  );
};
