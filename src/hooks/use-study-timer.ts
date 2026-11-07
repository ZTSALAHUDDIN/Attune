import { useEffect, useRef, useState } from 'react';

export function useStudyTimer(focusMinutes: number, breakMinutes: number, onPhaseEnd: (next: 'break' | 'focus') => void) {
  const [mode, setMode] = useState<'idle' | 'focus' | 'break'>('idle');
  const [left, setLeft] = useState(focusMinutes * 60);
  const [running, setRunning] = useState(false);
  const callback = useRef(onPhaseEnd);
  callback.current = onPhaseEnd;
  useEffect(() => { setMode('idle'); setRunning(false); setLeft(focusMinutes * 60); }, [focusMinutes, breakMinutes]);
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setLeft(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, [running]);
  useEffect(() => {
    if (left !== 0 || !running || mode === 'idle') return;
    if (mode === 'focus') {
      setMode('break'); setLeft(breakMinutes * 60); callback.current('break');
    } else {
      setMode('idle'); setRunning(false); setLeft(focusMinutes * 60); callback.current('focus');
    }
  }, [left, running, mode, focusMinutes, breakMinutes]);
  return {
    mode, left, running, focusMinutes, breakMinutes,
    startFocus: () => { setMode('focus'); setLeft(focusMinutes * 60); setRunning(true); },
    startBreak: () => { setMode('break'); setLeft(breakMinutes * 60); setRunning(true); },
    toggle: () => setRunning(value => !value),
    pauseFocus: () => { if (mode === 'focus') setRunning(false); },
    resumeFocus: () => { if (mode === 'focus') setRunning(true); },
    reset: () => { setMode('idle'); setRunning(false); setLeft(focusMinutes * 60); },
  };
}