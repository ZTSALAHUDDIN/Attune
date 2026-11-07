import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStudyTimer } from '@/hooks/use-study-timer';

afterEach(() => vi.useRealTimers());
describe('Student focus timing', () => {
  it('switches a short 20 minute focus session to a 2 minute break', () => {
    vi.useFakeTimers(); const callback = vi.fn();
    const { result } = renderHook(() => useStudyTimer(20, 2, callback));
    act(() => result.current.startFocus());
    act(() => vi.advanceTimersByTime(20 * 60 * 1000));
    expect(result.current.mode).toBe('break');
    expect(result.current.left).toBe(120);
    expect(callback).toHaveBeenCalledWith('break');
  });
  it('uses new custom durations after changing an active technique', () => {
    const { result, rerender } = renderHook(({ focus, rest }) => useStudyTimer(focus, rest, vi.fn()), { initialProps: { focus: 25, rest: 5 } });
    act(() => result.current.startFocus());
    rerender({ focus: 35, rest: 7 });
    expect(result.current.mode).toBe('idle');
    expect(result.current.left).toBe(2100);
    act(() => result.current.startBreak());
    expect(result.current.left).toBe(420);
  });
  it('stops focus countdown when the lesson is paused', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useStudyTimer(25, 5, vi.fn()));
    act(() => result.current.startFocus());
    act(() => result.current.pauseFocus());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.left).toBe(1500);
  });
});