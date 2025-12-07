import React, { useState, useEffect, useCallback, useRef } from 'react';
import { isMobileDevice } from '../../utils/device';

/**
 * Notification types with different visual styles
 */
export type NotificationType = 'kill' | 'pursuit' | 'prompt' | 'alert';

interface TransientNotification {
  id: number;
  type: NotificationType;
  message: string;
  subtext?: string;
  combo: number; // For score popup scaling
}

interface NotificationController {
  addNotification: (type: NotificationType, message: string, subtext?: string, combo?: number) => void;
}

interface NotificationSystemProps {
  onRegister: (controller: NotificationController) => void;
  // Persistent prompts - shown while condition is true
  showEnterPrompt?: boolean;
  showTasedAlert?: boolean;
  taseEscapeProgress?: number; // 0-100 progress for escaping taser
}

const NOTIFICATION_STYLES: Record<NotificationType, {
  textClass: string;
  textShadow: string;
  subtextClass?: string;
  subtextShadow?: string;
}> = {
  kill: {
    textClass: 'text-2xl text-red-500',
    textShadow: '0 0 10px #ef4444, 0 0 20px #ef4444, 0 0 40px #dc2626',
    subtextClass: 'text-base text-white',
    subtextShadow: '0 0 8px #fff, 0 0 16px #fff',
  },
  pursuit: {
    textClass: 'text-3xl text-orange-400 scale-110',
    textShadow: '0 0 10px #f97316, 0 0 20px #f97316, 0 0 40px #ea580c, 0 0 80px #ea580c',
    subtextClass: 'text-lg text-yellow-300',
    subtextShadow: '0 0 8px #fde047, 0 0 16px #facc15',
  },
  prompt: {
    textClass: 'text-3xl text-cyan-400',
    textShadow: '0 0 10px #22d3ee, 0 0 20px #22d3ee, 0 0 40px #06b6d4, 0 0 80px #06b6d4, 2px 2px 0 #000',
  },
  alert: {
    textClass: 'text-3xl text-yellow-400',
    textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
    subtextClass: 'text-xl text-white',
    subtextShadow: '2px 2px 0 #000',
  },
};

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  onRegister,
  showEnterPrompt = false,
  showTasedAlert = false,
  taseEscapeProgress = 0,
}) => {
  const [notifications, setNotifications] = useState<TransientNotification[]>([]);
  const nextIdRef = useRef(0);
  const isMobile = isMobileDevice();

  const addNotification = useCallback((type: NotificationType, message: string, subtext?: string, combo: number = 0) => {
    const id = nextIdRef.current++;

    setNotifications(prev => {
      const limited = prev.length >= 3 ? prev.slice(1) : prev;
      return [...limited, { id, type, message, subtext, combo }];
    });

    // Auto-remove after animation (longer for high combo)
    const duration = combo >= 20 ? 1800 : combo >= 10 ? 1500 : 1200;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  useEffect(() => {
    onRegister({ addNotification });
  }, [onRegister, addNotification]);

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Transient notifications (kills, etc) */}
      {notifications.map((notification, index) => {
        const style = NOTIFICATION_STYLES[notification.type];
        // Scale based on combo: 1.0 at 0, up to 2.0 at 50+ combo
        const comboScale = 1 + Math.min(notification.combo, 50) * 0.02;
        // Extra glow intensity at high combo
        const glowIntensity = notification.combo >= 20 ? 1.5 : notification.combo >= 10 ? 1.2 : 1;
        return (
          <div
            key={notification.id}
            className="absolute inset-x-0 flex justify-center"
            style={{
              top: `calc(40% - ${index * 50}px)`,
              animation: `notif-fadeSlideUp ${notification.combo >= 10 ? '1.5s' : '1.2s'} ease-out forwards`,
              transform: `scale(${comboScale})`,
            }}
          >
            <div className="text-center">
              <div
                className={`font-black retro ${style.textClass}`}
                style={{
                  textShadow: style.textShadow,
                  filter: glowIntensity > 1 ? `brightness(${glowIntensity})` : undefined,
                }}
              >
                {notification.message}
              </div>
              {notification.subtext && style.subtextClass && (
                <div
                  className={`font-bold retro ${style.subtextClass}`}
                  style={{
                    textShadow: style.subtextShadow,
                    filter: glowIntensity > 1 ? `brightness(${glowIntensity})` : undefined,
                  }}
                >
                  {notification.subtext}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Persistent: Enter Vehicle Prompt - hidden when tased */}
      {showEnterPrompt && !showTasedAlert && (
        <div
          className="absolute inset-x-0 top-1/2 flex justify-center -translate-y-1/2"
          style={{ animation: 'notif-pulse 1s ease-in-out infinite' }}
        >
          <div
            className={`font-black retro ${NOTIFICATION_STYLES.prompt.textClass}`}
            style={{ textShadow: NOTIFICATION_STYLES.prompt.textShadow }}
          >
            {isMobile ? 'TAP TO ENTER' : 'PRESS SPACE TO ENTER'}
          </div>
        </div>
      )}

      {/* Persistent: Tased Alert - Cyan/Blue theme */}
      {showTasedAlert && (
        <>
          {/* Dark vignette overlay with cyan tint */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,50,80,0.3) 20%, rgba(0,0,0,0.8) 100%)',
              animation: 'taser-vignette-pulse 0.15s infinite alternate',
            }}
          />

          {/* Centered content container */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            {/* Title */}
            <div
              className="text-center mb-4 md:mb-6"
              style={{ animation: 'notif-shake 0.08s infinite' }}
            >
              <div
                className="font-black retro text-3xl md:text-6xl"
                style={{
                  color: '#00F5FF',
                  textShadow: '0 0 15px #00F5FF, 0 0 30px #06b6d4, 3px 3px 0 #000',
                  animation: 'notif-flash 0.2s infinite',
                }}
              >
                ⚡ TASED! ⚡
              </div>
              <div
                className="font-bold retro text-sm md:text-2xl text-white mt-2"
                style={{
                  textShadow: '2px 2px 0 #000',
                  animation: 'taser-text-shake 0.1s infinite',
                }}
              >
                {isMobile ? 'TAP TO ESCAPE!' : 'MASH SPACE TO ESCAPE!'}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs md:max-w-md">
              <div
                className="relative w-full h-10 md:h-16 border-4 border-cyan-400 rounded-lg overflow-hidden"
                style={{
                  boxShadow: '0 4px 0 #0e7490, 0 0 20px rgba(0,245,255,0.4)',
                  background: '#0a0a0a',
                }}
              >
                {/* Progress fill - cyan gradient */}
                <div
                  className="absolute left-0 top-0 h-full transition-all duration-75"
                  style={{
                    width: `${taseEscapeProgress}%`,
                    background: taseEscapeProgress > 80
                      ? 'linear-gradient(to right, #22c55e, #4ade80)'
                      : 'linear-gradient(to right, #0891b2, #22d3ee, #00F5FF)',
                    boxShadow: taseEscapeProgress > 80
                      ? '0 0 20px #4ade80'
                      : '0 0 20px #00F5FF',
                  }}
                />

                {/* Percentage text */}
                <div
                  className="absolute inset-0 flex items-center justify-center font-black retro text-white text-xl md:text-3xl"
                  style={{ textShadow: '2px 2px 0 #000' }}
                >
                  {Math.floor(taseEscapeProgress)}%
                </div>
              </div>

              {/* Key indicator */}
              <div className="flex justify-center mt-3">
                <div
                  className="px-4 py-1.5 md:px-6 md:py-2 bg-cyan-900 border-2 md:border-4 border-cyan-400 rounded-lg font-black retro text-sm md:text-xl text-cyan-300"
                  style={{
                    boxShadow: '0 3px 0 #0e7490, 0 0 10px rgba(0,245,255,0.3)',
                    animation: 'taser-key-bounce 0.15s infinite',
                  }}
                >
                  {isMobile ? '👆 TAP' : 'SPACE'}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes notif-fadeSlideUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.9); }
          20% { opacity: 1; transform: translateY(0) scale(1); }
          80% { opacity: 1; transform: translateY(-30px); }
          100% { opacity: 0; transform: translateY(-60px); }
        }
        @keyframes notif-pulse {
          0%, 100% { opacity: 1; transform: translateY(-50%) scale(1); }
          50% { opacity: 0.8; transform: translateY(-50%) scale(1.02); }
        }
        @keyframes notif-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        @keyframes notif-flash {
          0%, 50% { opacity: 1; }
          25%, 75% { opacity: 0.6; }
        }
        @keyframes taser-vignette-pulse {
          0% { opacity: 0.8; }
          100% { opacity: 1; }
        }
        @keyframes taser-text-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        @keyframes taser-key-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};

export default NotificationSystem;
export type { NotificationController };
