import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Lock, RotateCcw, Check, AlertCircle } from 'lucide-react';

interface PatternLockProps {
  onComplete: (pattern: number[]) => boolean | Promise<boolean> | void;
  mode?: 'verify' | 'create';
  title?: string;
  subtitle?: string;
  minPoints?: number;
  onCancel?: () => void;
  onPatternCreated?: (pattern: number[]) => void;
  size?: number;
}

export const PatternLock: React.FC<PatternLockProps> = ({
  onComplete,
  mode = 'verify',
  title,
  subtitle,
  minPoints = 4,
  onCancel,
  onPatternCreated,
  size = 280,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedDots, setSelectedDots] = useState<number[]>([]);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [status, setStatus] = useState<'idle' | 'drawing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Creation mode state
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [firstPattern, setFirstPattern] = useState<number[]>([]);

  // 9 Dots coordinates calculation
  const getDotPositions = useCallback(() => {
    const positions: { x: number; y: number; index: number }[] = [];
    const padding = size * 0.16;
    const spacing = (size - padding * 2) / 2;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        positions.push({
          x: padding + col * spacing,
          y: padding + row * spacing,
          index: row * 3 + col,
        });
      }
    }
    return positions;
  }, [size]);

  // Canvas drawing loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const dots = getDotPositions();
    const dotRadius = size * 0.055;
    const hitRadius = size * 0.12;

    // Theme Colors based on status
    let lineColor = '#0d9488'; // teal-600
    let nodeColor = '#14b8a6'; // teal-500
    let glowColor = 'rgba(20, 184, 166, 0.35)';

    if (status === 'error') {
      lineColor = '#f43f5e'; // rose-500
      nodeColor = '#e11d48'; // rose-600
      glowColor = 'rgba(244, 63, 94, 0.4)';
    } else if (status === 'success') {
      lineColor = '#10b981'; // emerald-500
      nodeColor = '#059669'; // emerald-600
      glowColor = 'rgba(16, 185, 129, 0.4)';
    }

    // 1. Draw Connecting Lines between selected dots
    if (selectedDots.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = size * 0.024;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = lineColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12;

      const firstDot = dots[selectedDots[0]];
      ctx.moveTo(firstDot.x, firstDot.y);

      for (let i = 1; i < selectedDots.length; i++) {
        const dot = dots[selectedDots[i]];
        ctx.lineTo(dot.x, dot.y);
      }

      // 2. Draw line to current finger/mouse position if still drawing
      if (isDrawing && currentPos) {
        ctx.lineTo(currentPos.x, currentPos.y);
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }

    // 3. Draw All 9 Dots
    dots.forEach((dot) => {
      const isSelected = selectedDots.includes(dot.index);

      // Outer Ring / Aura if selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, hitRadius * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, hitRadius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Inner Core Dot
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, isSelected ? dotRadius * 1.25 : dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? nodeColor : '#94a3b8'; // slate-400
      ctx.shadowColor = isSelected ? glowColor : 'transparent';
      ctx.shadowBlur = isSelected ? 8 : 0;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    ctx.restore();
  }, [getDotPositions, isDrawing, selectedDots, currentPos, status, size]);

  // Setup HiDPI canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    draw();
  }, [size, draw]);

  // Redraw when state updates
  useEffect(() => {
    draw();
  }, [draw]);

  // Coordinate helper from PointerEvent / TouchEvent
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const getTouchedDot = (x: number, y: number): number | null => {
    const dots = getDotPositions();
    const hitRadius = size * 0.12;

    for (const dot of dots) {
      const dx = dot.x - x;
      const dy = dot.y - y;
      if (Math.hypot(dx, dy) <= hitRadius) {
        return dot.index;
      }
    }
    return null;
  };

  // Haptic feedback
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // ignore
      }
    }
  };

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (status === 'error' || status === 'success') return;
    e.currentTarget.setPointerCapture(e.pointerId);

    const pos = getCoordinates(e);
    if (!pos) return;

    setIsDrawing(true);
    setStatus('drawing');
    setStatusMessage('');

    const dotIndex = getTouchedDot(pos.x, pos.y);
    if (dotIndex !== null) {
      setSelectedDots([dotIndex]);
      triggerHaptic();
    } else {
      setSelectedDots([]);
    }
    setCurrentPos(pos);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getCoordinates(e);
    if (!pos) return;

    setCurrentPos(pos);
    const dotIndex = getTouchedDot(pos.x, pos.y);

    if (dotIndex !== null && !selectedDots.includes(dotIndex)) {
      setSelectedDots((prev) => [...prev, dotIndex]);
      triggerHaptic();
    }
  };

  const resetPattern = (delay = 0) => {
    setTimeout(() => {
      setSelectedDots([]);
      setCurrentPos(null);
      setIsDrawing(false);
      setStatus('idle');
      setStatusMessage('');
    }, delay);
  };

  const handlePointerUp = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setCurrentPos(null);

    // Minimum point validation
    if (selectedDots.length < minPoints) {
      setStatus('error');
      setStatusMessage(`Connect at least ${minPoints} dots.`);
      resetPattern(1100);
      return;
    }

    if (mode === 'create') {
      if (createStep === 1) {
        setFirstPattern(selectedDots);
        setCreateStep(2);
        setStatus('idle');
        setSelectedDots([]);
        setStatusMessage('Draw again to confirm pattern');
      } else {
        // Step 2: Compare
        const matches =
          firstPattern.length === selectedDots.length &&
          firstPattern.every((val, i) => val === selectedDots[i]);

        if (matches) {
          setStatus('success');
          setStatusMessage('Pattern confirmed! ✓');
          triggerHaptic();
          if (onPatternCreated) {
            onPatternCreated(selectedDots);
          }
          if (onComplete) {
            await onComplete(selectedDots);
          }
        } else {
          setStatus('error');
          setStatusMessage('Patterns did not match. Try again.');
          resetPattern(1200);
          setCreateStep(1);
          setFirstPattern([]);
        }
      }
    } else {
      // Verify mode
      try {
        const result = await onComplete(selectedDots);
        if (result === false) {
          setStatus('error');
          setStatusMessage('Incorrect pattern. Try again.');
          resetPattern(1100);
        } else {
          setStatus('success');
          setStatusMessage('Pattern verified! ✓');
          triggerHaptic();
        }
      } catch {
        setStatus('error');
        setStatusMessage('Verification failed.');
        resetPattern(1100);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Title & Prompt */}
      <div className="text-center mb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center justify-center space-x-2">
          <Lock className="w-4 h-4 text-teal-600" />
          <span>{title || (mode === 'create' ? 'Set Your 9-Dot Pattern' : 'Draw Your Pattern')}</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {subtitle ||
            (mode === 'create'
              ? createStep === 1
                ? `Connect at least ${minPoints} dots`
                : 'Confirm by drawing the same pattern'
              : 'Swipe across the 9 dots to unlock')}
        </p>
      </div>

      {/* Dynamic Status / Feedback text */}
      <div className="h-6 flex items-center justify-center mb-2">
        {statusMessage && (
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
              status === 'error'
                ? 'bg-rose-100 text-rose-700 animate-shake'
                : status === 'success'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-teal-50 text-teal-700'
            }`}
          >
            {status === 'error' && <AlertCircle className="w-3.5 h-3.5 mr-1" />}
            {status === 'success' && <Check className="w-3.5 h-3.5 mr-1" />}
            <span>{statusMessage}</span>
          </span>
        )}
      </div>

      {/* Canvas Drawing Surface */}
      <div
        className={`relative p-3 rounded-3xl bg-slate-900/5 backdrop-blur-sm border transition-all ${
          status === 'error'
            ? 'border-rose-300 shadow-lg shadow-rose-500/10'
            : status === 'success'
            ? 'border-emerald-300 shadow-lg shadow-emerald-500/10'
            : 'border-slate-200/80 shadow-inner'
        }`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="cursor-crosshair rounded-2xl block touch-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4 mt-4">
        {mode === 'create' && createStep === 2 && (
          <button
            type="button"
            onClick={() => {
              setCreateStep(1);
              setFirstPattern([]);
              resetPattern();
            }}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Pattern</span>
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
