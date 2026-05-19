import { useState, useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';

interface VoiceRecordButtonProps {
  isRecording: boolean;
  onClick: () => void;
  size?: 'large' | 'medium';
  disabled?: boolean;
  showText?: boolean;
}

export default function VoiceRecordButton({
  isRecording,
  onClick,
  size = 'large',
  disabled = false,
  showText = true,
}: VoiceRecordButtonProps) {
  const [ripplePhase, setRipplePhase] = useState(0);
  const [waveBars, setWaveBars] = useState<number[]>([0.3, 0.5, 0.4, 0.6, 0.35, 0.55, 0.45]);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isRecording) {
      setRipplePhase(0);
      setWaveBars([0.3, 0.5, 0.4, 0.6, 0.35, 0.55, 0.45]);
      return;
    }

    let frame = 0;
    const animate = () => {
      frame++;
      setRipplePhase(frame % 300);

      // Animate sound wave bars with smooth random-like motion
      setWaveBars(prev => prev.map((_, i) => {
        const base = 0.4 + Math.sin(frame * 0.1 + i * 0.8) * 0.25;
        const variation = Math.sin(frame * 0.15 + i * 1.2) * 0.15;
        return Math.min(1, Math.max(0.15, base + variation));
      }));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  const buttonSize = size === 'large' ? 120 : 88;
  const iconSize = size === 'large' ? 44 : 32;

  // Ripple animation for outer glow
  const rippleScale = isRecording ? 1 + (Math.sin(ripplePhase * Math.PI / 150) * 0.15) : 1;
  const rippleOpacity = isRecording ? 0.6 + (Math.sin(ripplePhase * Math.PI / 150) * 0.2) : 0.4;

  return (
    <div className="relative flex flex-col items-center">
      {/* Outer ambient glow layer */}
      {isRecording && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: buttonSize + 180,
            height: buttonSize + 180,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 180, 80, 0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
            transform: `scale(${rippleScale * 1.1})`,
            opacity: rippleOpacity * 0.5,
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
          }}
        />
      )}

      {/* Main button container */}
      <div className="relative flex flex-col items-center" style={{ gap: 16 }}>
        {/* Button with glow effects */}
        <div className="relative flex items-center justify-center">
          {/* Outer rippling glow rings */}
          {isRecording && (
            <>
              <div
                className="absolute rounded-full"
                style={{
                  width: buttonSize + 100,
                  height: buttonSize + 100,
                  background: `radial-gradient(circle, rgba(255, 150, 50, ${0.2 * rippleOpacity}) 0%, rgba(255, 120, 80, ${0.1 * rippleOpacity}) 50%, transparent 70%)`,
                  filter: 'blur(25px)',
                  transform: `scale(${1 + Math.sin(ripplePhase * Math.PI / 150) * 0.1})`,
                  transition: 'transform 1s ease-out',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: buttonSize + 60,
                  height: buttonSize + 60,
                  background: `radial-gradient(circle, rgba(255, 160, 60, ${0.35 * rippleOpacity}) 0%, rgba(255, 130, 70, ${0.2 * rippleOpacity}) 50%, transparent 70%)`,
                  filter: 'blur(15px)',
                  transform: `scale(${1 + Math.cos(ripplePhase * Math.PI / 150) * 0.08})`,
                  transition: 'transform 0.8s ease-out',
                }}
              />
            </>
          )}

          {/* Main button */}
          <button
            onClick={onClick}
            disabled={disabled}
            className="relative flex items-center justify-center rounded-full transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              width: buttonSize,
              height: buttonSize,
              background: 'linear-gradient(145deg, #FFFFFF 0%, #FFF8F0 100%)',
              boxShadow: isRecording
                ? `
                  0 0 0 5px rgba(249, 115, 22, ${0.5 * rippleOpacity}),
                  0 0 40px rgba(249, 115, 22, ${0.4 * rippleOpacity}),
                  0 0 80px rgba(249, 115, 22, ${0.2 * rippleOpacity}),
                  inset 0 2px 10px rgba(255, 255, 255, 0.8),
                  inset 0 -2px 10px rgba(200, 100, 50, 0.05)
                `
                : '0 0 0 3px rgba(249, 115, 22, 0.3), 0 0 25px rgba(249, 115, 22, 0.15), inset 0 2px 10px rgba(255, 255, 255, 0.8)',
            }}
          >
            {/* Inner glow effect */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: isRecording
                  ? `radial-gradient(circle at 30% 30%, rgba(255, 200, 150, 0.4) 0%, transparent 60%)`
                  : 'none',
                transition: 'opacity 0.5s ease',
                opacity: isRecording ? 1 : 0,
              }}
            />

            {/* Microphone icon */}
            <Mic
              size={iconSize}
              className="relative z-10"
              style={{
                color: '#F97316',
                fill: '#F97316',
                fillOpacity: 0.15,
                filter: isRecording
                  ? 'drop-shadow(0 0 12px rgba(249, 115, 22, 0.7))'
                  : 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.3))',
                transition: 'filter 0.3s ease',
              }}
            />
          </button>
        </div>

        {/* Text below button */}
        {showText && (
          <p
            className="text-center"
            style={{
              fontSize: size === 'large' ? 16 : 14,
              fontWeight: 500,
              color: '#4A4A4A',
              letterSpacing: '0.02em',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {isRecording ? '点击停止录音' : '点击开始录音'}
          </p>
        )}

        {/* Sound wave visualizer - strictly below text */}
        {isRecording && (
          <div
            className="relative flex items-center justify-center gap-2"
            style={{
              height: 48,
              marginTop: 8,
            }}
          >
            {/* Glow behind sound waves */}
            <div
              className="absolute"
              style={{
                width: 200,
                height: 60,
                background: 'radial-gradient(ellipse, rgba(255, 150, 100, 0.15) 0%, transparent 70%)',
                filter: 'blur(15px)',
              }}
            />

            {/* Sound wave bars */}
            {waveBars.map((height, i) => (
              <div
                key={i}
                className="relative rounded-full"
                style={{
                  width: size === 'large' ? 5 : 4,
                  height: height * 40,
                  background: `linear-gradient(180deg, #FB923C 0%, #F472B6 100%)`,
                  boxShadow: '0 0 10px rgba(251, 146, 60, 0.4), 0 0 20px rgba(244, 114, 182, 0.2)',
                  transition: 'height 0.15s ease-out',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
