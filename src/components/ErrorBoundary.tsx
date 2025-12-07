import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  blinkVisible: boolean;
  glitchOffset: number;
}

// Neon colors matching LoadingScreen and Overlay
const NEON = {
  yellow: '#FFE500',
  cyan: '#00F5FF',
  magenta: '#FF00FF',
  red: '#FF3333',
  orange: '#FF8800',
  purple: '#AA55FF',
};

const ERROR_MESSAGES = [
  "SKILL ISSUE DETECTED.",
  "THE MACHINE WINS THIS ROUND.",
  "REALITY.EXE HAS CRASHED.",
  "SOMEONE CALL A MECHANIC.",
  "YOUR COINS HAVE BEEN EATEN.",
  "TRY HITTING THE CABINET.",
  "ERROR 404: MAYHEM NOT FOUND.",
  "GREMLINS IN THE SYSTEM.",
];

class ErrorBoundary extends Component<Props, State> {
  public readonly props: Readonly<Props>;
  public state: State = {
    hasError: false,
    error: null,
    blinkVisible: true,
    glitchOffset: 0,
  };
  private blinkInterval: ReturnType<typeof setInterval> | null = null;
  private glitchInterval: ReturnType<typeof setInterval> | null = null;
  private errorMessageIndex: number = Math.floor(Math.random() * ERROR_MESSAGES.length);

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    // Start animation intervals
    this.blinkInterval = setInterval(() => {
      this.setState(prev => ({ blinkVisible: !prev.blinkVisible }));
    }, 530);

    this.glitchInterval = setInterval(() => {
      this.setState({ glitchOffset: Math.random() > 0.7 ? (Math.random() - 0.5) * 4 : 0 });
    }, 100);
  }

  componentWillUnmount() {
    if (this.blinkInterval) clearInterval(this.blinkInterval);
    if (this.glitchInterval) clearInterval(this.glitchInterval);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { blinkVisible, glitchOffset } = this.state;

      return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden">
          {/* Scanline effect */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)'
            }}
          />

          {/* Pixel grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(${NEON.red}20 1px, transparent 1px),
                linear-gradient(90deg, ${NEON.red}20 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px'
            }}
          />

          {/* Glitch overlay */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{
              background: `linear-gradient(${90 + glitchOffset * 10}deg,
                transparent 0%,
                ${NEON.red}10 ${45 + glitchOffset * 5}%,
                ${NEON.cyan}05 ${55 + glitchOffset * 5}%,
                transparent 100%
              )`,
              transform: `translateX(${glitchOffset * 2}px)`,
            }}
          />

          <div className="relative w-full max-w-md px-6">
            {/* FATAL ERROR Title */}
            <div className="text-center mb-6">
              <h1
                className="text-3xl md:text-4xl font-bold retro leading-tight"
                style={{
                  color: NEON.red,
                  textShadow: `
                    0 0 20px ${NEON.red}80,
                    0 0 40px ${NEON.red}40,
                    4px 4px 0 #000,
                    ${glitchOffset}px 0 0 ${NEON.cyan}
                  `,
                  transform: `translateX(${glitchOffset}px)`,
                }}
              >
                FATAL
              </h1>
              <h1
                className="text-3xl md:text-4xl font-bold retro leading-tight -mt-1"
                style={{
                  color: NEON.yellow,
                  textShadow: `
                    0 0 20px ${NEON.yellow}80,
                    0 0 40px ${NEON.yellow}40,
                    4px 4px 0 #000,
                    ${-glitchOffset}px 0 0 ${NEON.magenta}
                  `,
                  transform: `translateX(${-glitchOffset}px)`,
                }}
              >
                ERROR
              </h1>
            </div>

            {/* Error message tagline */}
            <div className="text-center mb-6">
              <p
                className="text-xs retro tracking-wider"
                style={{ color: NEON.cyan, textShadow: `0 0 10px ${NEON.cyan}60` }}
              >
                {ERROR_MESSAGES[this.errorMessageIndex]}
              </p>
            </div>

            {/* Error details box */}
            {this.state.error && (
              <div className="mb-6">
                {/* Outer frame */}
                <div
                  className="p-1"
                  style={{
                    background: NEON.red,
                    boxShadow: `0 0 20px ${NEON.red}40`
                  }}
                >
                  {/* Inner black area */}
                  <div className="bg-black p-3">
                    {/* Error content */}
                    <div className="flex items-start gap-2">
                      {/* Warning icon */}
                      <div
                        className="flex-shrink-0 text-lg retro"
                        style={{
                          color: NEON.yellow,
                          textShadow: `0 0 10px ${NEON.yellow}80`,
                          opacity: blinkVisible ? 1 : 0.3,
                        }}
                      >
                        ⚠
                      </div>
                      {/* Error text */}
                      <div className="overflow-auto max-h-32 flex-1">
                        <pre
                          className="text-[10px] retro whitespace-pre-wrap break-words"
                          style={{
                            color: NEON.orange,
                            textShadow: `0 0 5px ${NEON.orange}40`,
                          }}
                        >
                          {this.state.error.message}
                        </pre>
                      </div>
                    </div>

                    {/* Fake terminal footer */}
                    <div className="mt-3 pt-2 border-t border-neutral-800">
                      <p
                        className="text-[8px] retro"
                        style={{ color: '#666' }}
                      >
                        ADDR: 0x{Math.random().toString(16).slice(2, 10).toUpperCase()}
                        <span style={{ opacity: blinkVisible ? 1 : 0 }}> _</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reload Button */}
            <div className="text-center">
              <button
                onClick={this.handleReload}
                className="group relative px-10 py-3 retro text-lg transition-all hover:scale-105 active:scale-95"
                style={{
                  background: NEON.yellow,
                  color: '#000',
                  boxShadow: `
                    0 0 30px ${NEON.yellow}60,
                    0 6px 0 #8B6914,
                    inset 0 2px 0 rgba(255,255,255,0.3)
                  `,
                  textShadow: '1px 1px 0 rgba(255,255,255,0.3)',
                }}
              >
                <span className="relative z-10">CONTINUE?</span>
                {/* Animated glow pulse */}
                <div
                  className="absolute inset-0 animate-pulse opacity-50"
                  style={{
                    background: `radial-gradient(ellipse at center, ${NEON.red}40 0%, transparent 70%)`,
                  }}
                />
              </button>

              {/* Blinking prompt */}
              <p
                className="text-[10px] retro mt-4 tracking-widest"
                style={{
                  color: NEON.cyan,
                  opacity: blinkVisible ? 1 : 0.3,
                  textShadow: `0 0 10px ${NEON.cyan}60`
                }}
              >
                INSERT COIN TO RETRY
              </p>
            </div>

            {/* Decorative corners */}
            <div className="absolute -top-4 -left-4 w-4 h-4 border-t-4 border-l-4" style={{ borderColor: NEON.red }} />
            <div className="absolute -top-4 -right-4 w-4 h-4 border-t-4 border-r-4" style={{ borderColor: NEON.red }} />
            <div className="absolute -bottom-4 -left-4 w-4 h-4 border-b-4 border-l-4" style={{ borderColor: NEON.red }} />
            <div className="absolute -bottom-4 -right-4 w-4 h-4 border-b-4 border-r-4" style={{ borderColor: NEON.red }} />
          </div>

          {/* Footer */}
          <div className="absolute bottom-6 text-center">
            <p className="text-[8px] retro tracking-widest" style={{ color: '#444' }}>
              SYSTEM MALFUNCTION • PLEASE STAND BY
            </p>
          </div>

          {/* Animated static noise bars (rare) */}
          {glitchOffset !== 0 && (
            <div
              className="absolute pointer-events-none"
              style={{
                top: `${30 + Math.random() * 40}%`,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${NEON.cyan}60, ${NEON.red}60, transparent)`,
                opacity: 0.8,
              }}
            />
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
